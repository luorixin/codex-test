import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/src/stores/authStore';
import type { ApiSuccessResponse } from '@/src/types/domain';

type HttpRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

export const apiClient = axios.create({
  baseURL: 'https://mock.catalog.local',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: serializeQueryParams,
  },
});

export const httpClient = {
  request: requestData,
  get: <T>(url: string, config?: HttpRequestConfig) =>
    requestData<T>({ ...config, method: 'get', url }),
  post: <T>(url: string, data?: unknown, config?: HttpRequestConfig) =>
    requestData<T>({ ...config, method: 'post', url, data }),
  put: <T>(url: string, data?: unknown, config?: HttpRequestConfig) =>
    requestData<T>({ ...config, method: 'put', url, data }),
  patch: <T>(url: string, data?: unknown, config?: HttpRequestConfig) =>
    requestData<T>({ ...config, method: 'patch', url, data }),
  delete: <T>(url: string, config?: HttpRequestConfig) =>
    requestData<T>({ ...config, method: 'delete', url }),
};

let interceptorsConfigured = false;

export function initHttpClient() {
  if (interceptorsConfigured) {
    return;
  }

  configureApiClientInterceptors();
}

function configureApiClientInterceptors() {
  if (interceptorsConfigured) {
    return;
  }

  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    config.params = sanitizeRequestPayload(config.params);
    config.data = sanitizeRequestPayload(config.data);
    return applyAuthorizationHeader(config, token);
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const retryResponse = await tryRefreshAndRetryRequest(error);

      if (retryResponse) {
        return retryResponse;
      }

      throw error;
    },
  );

  interceptorsConfigured = true;
}

async function requestData<T>(config: HttpRequestConfig): Promise<T> {
  const response = await apiClient.request<T | ApiSuccessResponse<T>>(config);
  return unwrapResponseData<T>(response.data);
}

function applyAuthorizationHeader(config: InternalAxiosRequestConfig, token: string | null) {
  if (!token) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  config.headers = headers;
  return config;
}

async function tryRefreshAndRetryRequest(error: unknown) {
  if (!isRetryableUnauthorizedError(error)) {
    return null;
  }

  const requestConfig = error.config as RetryableRequestConfig;

  if (requestConfig.skipAuthRefresh || requestConfig._retry) {
    await useAuthStore.getState().logout('unauthorized');
    return null;
  }

  requestConfig._retry = true;

  const refreshedAccessToken = await useAuthStore.getState().refreshSession();

  if (!refreshedAccessToken) {
    await useAuthStore.getState().logout('unauthorized');
    return null;
  }

  return apiClient.request(applyAuthorizationHeader(requestConfig, refreshedAccessToken));
}

function isRetryableUnauthorizedError(
  error: unknown,
): error is AxiosError & { config: RetryableRequestConfig } {
  return axios.isAxiosError(error) && error.response?.status === 401 && Boolean(error.config);
}

function unwrapResponseData<T>(payload: T | ApiSuccessResponse<T>): T {
  if (isApiSuccessResponse(payload)) {
    return payload.data;
  }

  return payload as T;
}

function isApiSuccessResponse<T>(payload: unknown): payload is ApiSuccessResponse<T> {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    'data' in candidate && ('code' in candidate || 'message' in candidate || 'success' in candidate)
  );
}

function sanitizeRequestPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((entry) => sanitizeRequestPayload(entry))
      .filter((entry) => entry !== undefined);
  }

  if (!value || typeof value !== 'object') {
    return value === undefined ? undefined : value;
  }

  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, entry]) => {
    const normalizedEntry = sanitizeRequestPayload(entry);

    if (normalizedEntry !== undefined) {
      acc[key] = normalizedEntry;
    }

    return acc;
  }, {});
}

function serializeQueryParams(params: unknown) {
  const searchParams = new URLSearchParams();
  appendQueryParam(searchParams, '', sanitizeRequestPayload(params));
  return searchParams.toString();
}

function appendQueryParam(searchParams: URLSearchParams, prefix: string, value: unknown) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryParam(searchParams, prefix, item);
    }
    return;
  }

  if (value instanceof Date) {
    searchParams.append(prefix, value.toISOString());
    return;
  }

  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      appendQueryParam(searchParams, prefix ? `${prefix}[${key}]` : key, entry);
    }
    return;
  }

  if (prefix) {
    searchParams.append(prefix, String(value));
  }
}

import { httpClient } from '@/src/api/client';
import {
  getMockAuthLoginScreenConfig,
  loginWithMockAuth,
  refreshTokenWithMockAuth,
} from '@/src/api/mock/mockAuth';
import { isBackendApiEnabled } from '@/src/config/runtime';
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthLoginScreenConfig,
  AuthRefreshTokenRequest,
  AuthRefreshTokenResponse,
} from '@/src/types/domain';

export async function login(input: AuthLoginRequest): Promise<AuthLoginResponse> {
  if (isBackendApiEnabled()) {
    return httpClient.post<AuthLoginResponse>('/auth/login', input, {
      skipAuthRefresh: true,
      skipAuthorization: true,
      skipUnauthorizedLogout: true,
    });
  }

  return loginWithMockAuth(input);
}

export async function refreshToken(
  input: AuthRefreshTokenRequest,
): Promise<AuthRefreshTokenResponse> {
  if (isBackendApiEnabled()) {
    return httpClient.post<AuthRefreshTokenResponse>('/auth/refresh', input, {
      skipAuthRefresh: true,
      skipAuthorization: true,
    });
  }

  return refreshTokenWithMockAuth(input);
}

export function getLoginScreenConfig(): AuthLoginScreenConfig {
  return getMockAuthLoginScreenConfig();
}

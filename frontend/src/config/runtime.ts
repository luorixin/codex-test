export type ApiMode = 'mock' | 'backend';

const DEFAULT_BACKEND_BASE_URL = 'http://localhost:8080/api/v1';

export function getApiMode(): ApiMode {
  const rawValue = process.env.EXPO_PUBLIC_API_MODE?.trim().toLowerCase();
  return rawValue === 'backend' ? 'backend' : 'mock';
}

export function isBackendApiEnabled() {
  return getApiMode() === 'backend';
}

export function getBackendBaseUrl() {
  const rawValue =
    process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.trim() || DEFAULT_BACKEND_BASE_URL;

  return rawValue.endsWith('/') ? rawValue.slice(0, -1) : rawValue;
}

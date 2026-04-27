import {
  getLoginScreenConfig as getLoginScreenConfigFromApi,
  login as loginRequest,
  refreshToken as refreshTokenRequest,
} from '@/src/api/authApi';
import {
  clearAuthSession as clearStoredAuthSession,
  loadAuthSession,
  saveAuthSession,
} from '@/src/storage/secureAuthStorage';
import type {
  AuthLoginRequest,
  AuthLoginScreenConfig,
  AuthRefreshTokenResponse,
  AuthSession,
} from '@/src/types/domain';

export async function login(input: AuthLoginRequest): Promise<AuthSession> {
  const session = await loginRequest(input);
  await saveAuthSession(session);
  return session;
}

export async function restoreSession(): Promise<AuthSession | null> {
  return loadAuthSession();
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthRefreshTokenResponse> {
  const session = await refreshTokenRequest({ refreshToken });
  await saveAuthSession(session);
  return session;
}

export async function logout() {
  await clearStoredAuthSession();
}

export function getLoginScreenConfig(): AuthLoginScreenConfig {
  return getLoginScreenConfigFromApi();
}

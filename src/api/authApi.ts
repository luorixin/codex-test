import {
  getMockAuthLoginScreenConfig,
  loginWithMockAuth,
  refreshTokenWithMockAuth,
} from '@/src/api/mock/mockAuth';
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthLoginScreenConfig,
  AuthRefreshTokenRequest,
  AuthRefreshTokenResponse,
} from '@/src/types/domain';

export async function login(input: AuthLoginRequest): Promise<AuthLoginResponse> {
  return loginWithMockAuth(input);
}

export async function refreshToken(
  input: AuthRefreshTokenRequest,
): Promise<AuthRefreshTokenResponse> {
  return refreshTokenWithMockAuth(input);
}

export function getLoginScreenConfig(): AuthLoginScreenConfig {
  return getMockAuthLoginScreenConfig();
}

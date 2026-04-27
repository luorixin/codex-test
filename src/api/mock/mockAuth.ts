import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthLoginScreenConfig,
  AuthRefreshTokenRequest,
  AuthRefreshTokenResponse,
} from '@/src/types/domain';

const MOCK_EMAIL = 'demo@example.com';
const MOCK_PASSWORD = '123456';

export async function loginWithMockAuth(
  input: AuthLoginRequest,
): Promise<AuthLoginResponse> {
  await wait(250);

  if (
    input.email.trim().toLowerCase() !== MOCK_EMAIL ||
    input.password !== MOCK_PASSWORD
  ) {
    throw new Error('auth.errors.invalidCredentials');
  }

  return buildMockAuthSession(MOCK_EMAIL);
}

export async function refreshTokenWithMockAuth(
  input: AuthRefreshTokenRequest,
): Promise<AuthRefreshTokenResponse> {
  await wait(200);

  if (!input.refreshToken.startsWith(`mock-refresh-token:${MOCK_EMAIL}:`)) {
    throw new Error('auth.errors.refreshFailed');
  }

  return buildMockAuthSession(MOCK_EMAIL);
}

export function getMockAuthLoginScreenConfig(): AuthLoginScreenConfig {
  return {
    initialEmail: MOCK_EMAIL,
    initialPassword: MOCK_PASSWORD,
  };
}

function wait(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function buildMockAuthSession(email: string): AuthLoginResponse {
  return {
    accessToken: `mock-access-token:${email}:${Date.now()}`,
    refreshToken: `mock-refresh-token:${email}:${Date.now()}`,
    user: {
      email,
    },
  };
}

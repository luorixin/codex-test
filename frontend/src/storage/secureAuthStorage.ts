import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from '@/src/types/domain';

const AUTH_SESSION_KEY = 'quiz-mvp.auth-session.v1';

export async function saveAuthSession(session: AuthSession) {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const rawValue = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return normalizeAuthSession(JSON.parse(rawValue));
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

function normalizeAuthSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<AuthSession> & {
    user?: { email?: unknown };
  };

  if (
    typeof candidate.accessToken !== 'string' ||
    !candidate.user ||
    typeof candidate.user.email !== 'string'
  ) {
    return null;
  }

  return {
    accessToken: candidate.accessToken,
    refreshToken:
      typeof candidate.refreshToken === 'string' ? candidate.refreshToken : null,
    user: {
      email: candidate.user.email,
    },
  };
}

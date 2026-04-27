import { create } from 'zustand';

import {
  login as loginWithAuthService,
  refreshSession as refreshSessionWithAuthService,
  logout as logoutFromAuthService,
  restoreSession as restoreSessionFromAuthService,
} from '@/src/services/auth/authService';
import type {
  AuthLogoutReason,
  AuthSession,
  AuthStatus,
  AuthUser,
} from '@/src/types/domain';

type AuthStore = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isRefreshingSession: boolean;
  errorMessage?: string;
  lastLogoutReason?: AuthLogoutReason;
  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  refreshSession: () => Promise<string | null>;
  logout: (reason?: AuthLogoutReason) => Promise<void>;
  clearError: () => void;
};

let logoutPromise: Promise<void> | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoggingIn: false,
  isLoggingOut: false,
  isRefreshingSession: false,
  errorMessage: undefined,
  lastLogoutReason: undefined,
  restoreSession: async () => {
    if (get().status === 'restoring') {
      return;
    }

    set({
      status: 'restoring',
      errorMessage: undefined,
      lastLogoutReason: undefined,
    });

    try {
      const session = await restoreSessionFromAuthService();

      if (!session) {
        set({
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          refreshToken: null,
          errorMessage: undefined,
        });
        return;
      }

      setSessionState(set, session);
    } catch (error) {
      await logoutFromAuthService().catch(() => {});

      set({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
        refreshToken: null,
        errorMessage:
          error instanceof Error ? error.message : 'auth.errors.restoreFailed',
        lastLogoutReason: 'restore_failed',
      });
    }
  },
  login: async (email, password) => {
    if (get().isLoggingIn) {
      return;
    }

    set({
      isLoggingIn: true,
      errorMessage: undefined,
      lastLogoutReason: undefined,
    });

    try {
      const session = await loginWithAuthService({
        email: email.trim(),
        password,
      });

      setSessionState(set, session);
    } catch (error) {
      set({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
        refreshToken: null,
        errorMessage:
          error instanceof Error ? error.message : 'auth.errors.signInFailed',
      });
      throw error;
    } finally {
      set({
        isLoggingIn: false,
      });
    }
  },
  refreshSession: async () => {
    const state = get();

    if (refreshPromise) {
      return refreshPromise;
    }

    if (!state.refreshToken) {
      return null;
    }

    refreshPromise = (async () => {
      set({
        isRefreshingSession: true,
      });

      try {
        const session = await refreshSessionWithAuthService(state.refreshToken!);
        setSessionState(set, session);
        return session.accessToken;
      } catch {
        return null;
      } finally {
        set({
          isRefreshingSession: false,
        });
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },
  logout: async (reason = 'manual') => {
    if (logoutPromise) {
      return logoutPromise;
    }

    if (
      !get().accessToken &&
      !get().refreshToken &&
      get().status === 'unauthenticated'
    ) {
      set({
        lastLogoutReason: reason,
      });
      return;
    }

    logoutPromise = (async () => {
      set({
        isLoggingOut: true,
      });

      try {
        await logoutFromAuthService();
      } finally {
        set({
          status: 'unauthenticated',
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoggingIn: false,
          isLoggingOut: false,
          isRefreshingSession: false,
          errorMessage: undefined,
          lastLogoutReason: reason,
        });
        logoutPromise = null;
      }
    })();

    return logoutPromise;
  },
  clearError: () => {
    set({
      errorMessage: undefined,
      lastLogoutReason: undefined,
    });
  },
}));

function setSessionState(
  set: (partial: Partial<AuthStore>) => void,
  session: AuthSession,
) {
  set({
    status: 'authenticated',
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    errorMessage: undefined,
    lastLogoutReason: undefined,
  });
}

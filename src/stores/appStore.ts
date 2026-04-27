import { create } from 'zustand';

import { initHttpClient } from '@/src/api/client';
import { initializeDatabase } from '@/src/db/database';
import { useAuthStore } from '@/src/stores/authStore';
import { useLocaleStore } from '@/src/stores/localeStore';

type AppStore = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  errorMessage?: string;
  bootstrap: () => Promise<void>;
};

export const useAppStore = create<AppStore>((set, get) => ({
  status: 'idle',
  errorMessage: undefined,
  bootstrap: async () => {
    const { status } = get();

    if (status === 'loading' || status === 'ready') {
      return;
    }

    set({
      status: 'loading',
      errorMessage: undefined,
    });

    try {
      initHttpClient();
      await initializeDatabase();
      await useLocaleStore.getState().restoreLocale();
      await useAuthStore.getState().restoreSession();
      set({
        status: 'ready',
        errorMessage: undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'app.errors.bootstrapFailed';

      set({
        status: 'error',
        errorMessage: message,
      });
    }
  },
}));

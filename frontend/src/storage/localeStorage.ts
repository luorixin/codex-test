import * as SecureStore from 'expo-secure-store';

import type { LocalePreference } from '@/src/types/domain';

const LOCALE_PREFERENCE_KEY = 'quiz-mvp.locale-preference.v1';

export async function saveLocalePreference(preference: LocalePreference) {
  await SecureStore.setItemAsync(LOCALE_PREFERENCE_KEY, preference);
}

export async function loadLocalePreference(): Promise<LocalePreference | null> {
  const rawValue = await SecureStore.getItemAsync(LOCALE_PREFERENCE_KEY);

  if (rawValue === 'system' || rawValue === 'zh-CN' || rawValue === 'en') {
    return rawValue;
  }

  return null;
}

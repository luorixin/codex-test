import { getLocales } from 'expo-localization';
import { create } from 'zustand';

import { i18n, resolveSupportedLocaleTag } from '@/src/i18n';
import { loadLocalePreference, saveLocalePreference } from '@/src/storage/localeStorage';
import type { LocalePreference, SupportedLocale } from '@/src/types/domain';

type LocaleStore = {
  locale: LocalePreference;
  resolvedLocale: SupportedLocale;
  restoreLocale: () => Promise<void>;
  setLocale: (locale: LocalePreference) => Promise<void>;
  useSystemLocaleWhenNoPreference: () => Promise<void>;
};

export const useLocaleStore = create<LocaleStore>((set, get) => ({
  locale: 'system',
  resolvedLocale: getSystemSupportedLocale(),
  restoreLocale: async () => {
    const preference = (await loadLocalePreference()) ?? 'system';
    await applyLocalePreference(preference, set);
  },
  setLocale: async (locale) => {
    await saveLocalePreference(locale);
    await applyLocalePreference(locale, set);
  },
  useSystemLocaleWhenNoPreference: async () => {
    if (get().locale !== 'system') {
      return;
    }

    await applyLocalePreference('system', set);
  },
}));

async function applyLocalePreference(
  preference: LocalePreference,
  set: (partial: Partial<LocaleStore>) => void,
) {
  const resolvedLocale =
    preference === 'system' ? getSystemSupportedLocale() : preference;

  await i18n.changeLanguage(resolvedLocale);

  set({
    locale: preference,
    resolvedLocale,
  });
}

function getSystemSupportedLocale(): SupportedLocale {
  const firstLocale = getLocales()[0];
  return resolveSupportedLocaleTag(firstLocale?.languageTag);
}

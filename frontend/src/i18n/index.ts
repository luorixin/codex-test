import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { SupportedLocale } from '@/src/types/domain';
import en from '@/src/i18n/locales/en';
import zhCN from '@/src/i18n/locales/zh-CN';

export const supportedLocales: SupportedLocale[] = ['zh-CN', 'en'];
export const defaultLocale: SupportedLocale = 'zh-CN';
export const fallbackLocale: SupportedLocale = 'zh-CN';

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  en: {
    translation: en,
  },
} as const;

let isInitialized = false;

export function setupI18n(initialLocale: SupportedLocale = defaultLocale) {
  if (isInitialized) {
    return i18n;
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: initialLocale,
    fallbackLng: fallbackLocale,
    interpolation: {
      escapeValue: false,
    },
  });

  isInitialized = true;
  return i18n;
}

setupI18n();

export { i18n };

export function t(key: string, params?: Record<string, unknown>) {
  return i18n.t(key, params);
}

export function formatDate(
  value: string | number | Date,
  localeOrOptions:
    | SupportedLocale
    | Intl.DateTimeFormatOptions = resolveSupportedLocaleTag(i18n.language),
  maybeOptions?: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  const locale =
    typeof localeOrOptions === 'string'
      ? localeOrOptions
      : resolveSupportedLocaleTag(i18n.language);
  const options =
    typeof localeOrOptions === 'string'
      ? maybeOptions ?? {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }
      : localeOrOptions;
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumber(
  value: number,
  locale: SupportedLocale = resolveSupportedLocaleTag(i18n.language),
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(
  value: number,
  locale: SupportedLocale = resolveSupportedLocaleTag(i18n.language),
  options: Intl.NumberFormatOptions = {
    style: 'percent',
    maximumFractionDigits: 0,
  },
) {
  return new Intl.NumberFormat(locale, options).format(value / 100);
}

export function resolveSupportedLocaleTag(locale: string | undefined): SupportedLocale {
  if (locale?.toLowerCase().startsWith('en')) {
    return 'en';
  }

  return 'zh-CN';
}

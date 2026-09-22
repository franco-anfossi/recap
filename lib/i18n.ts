// Localization. English is the source language; Spanish is the first translation.
// Usage: t('auth.login.title'), t('common.daysCount', { count: 3 }), t('setup.greeting', { name }).
// Interpolation uses %{name}; plural keys use { one, other } objects with `count`.
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { Platform } from 'react-native';

import en from '@/locales/en';
import es from '@/locales/es';

export type Locale = 'en' | 'es';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'es'];

const i18n = new I18n({ en, es });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function detectLocale(): Locale {
  // Dev-only override so the Spanish build can be checked in a browser: localStorage.setItem('recap-locale', 'es')
  if (__DEV__ && Platform.OS === 'web') {
    try {
      const forced = window.localStorage?.getItem('recap-locale');
      if (forced === 'en' || forced === 'es') return forced;
    } catch {
      // ignore
    }
  }
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'es' ? 'es' : 'en';
}

i18n.locale = detectLocale();

export const locale: Locale = i18n.locale as Locale;
export const isSpanish = locale === 'es';

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export default i18n;

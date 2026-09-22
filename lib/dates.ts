// Locale-aware date formatting. Use instead of date-fns `format` for anything the user reads.
import { format as dfFormat } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { isSpanish } from './i18n';

const dateLocale = isSpanish ? es : enUS;

// Spanish reads day-first. Screens write English patterns; we swap the common ones here
// so every date in the app follows the same convention without per-screen branching.
const SPANISH_PATTERNS: Record<string, string> = {
  'MMM d': 'd MMM',
  'MMMM d': "d 'de' MMMM",
  'EEEE, MMMM d': "EEEE d 'de' MMMM",
  'EEEE, MMM d': 'EEEE d MMM',
  'EEEE, MMMM d, yyyy': "EEEE d 'de' MMMM 'de' yyyy",
  'MMM d, yyyy': "d MMM yyyy",
  'MMM d, h:mm a': 'd MMM, HH:mm',
  'h:mm a': 'HH:mm',
};

export function fmt(date: Date | number, pattern: string): string {
  const resolved = isSpanish ? SPANISH_PATTERNS[pattern] ?? pattern : pattern;
  return dfFormat(date, resolved, { locale: dateLocale });
}

/** Capitalizes the first letter (Spanish weekday/month names are lowercase by default). */
export function fmtCap(date: Date | number, pattern: string): string {
  const s = fmt(date, pattern);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export { dateLocale };

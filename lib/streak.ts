import { t } from '@/lib/i18n';
import { Entry } from '@/types';
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';

/** Consecutive days with an entry, ending today or yesterday. */
export function calculateCurrentStreak(entries: Pick<Entry, 'entry_date'>[], now = new Date()): number {
  if (entries.length === 0) return 0;

  const entryDates = new Set(entries.map((e) => e.entry_date));
  const today = format(now, 'yyyy-MM-dd');
  const yesterday = format(subDays(now, 1), 'yyyy-MM-dd');

  let checkDate: string;
  if (entryDates.has(today)) {
    checkDate = today;
  } else if (entryDates.has(yesterday)) {
    checkDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (entryDates.has(checkDate)) {
    streak++;
    checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
  }
  return streak;
}

/** Longest run of consecutive days with an entry. */
export function calculateLongestStreak(entries: Pick<Entry, 'entry_date'>[]): number {
  if (entries.length === 0) return 0;

  const dates = Array.from(new Set(entries.map((e) => e.entry_date))).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const gap = differenceInCalendarDays(parseISO(dates[i]), parseISO(dates[i - 1]));
    if (gap === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (gap > 1) {
      current = 1;
    }
  }
  return longest;
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return t('today.greeting.stillUp');
  if (hour < 12) return t('today.greeting.morning');
  if (hour < 18) return t('today.greeting.afternoon');
  return t('today.greeting.evening');
}

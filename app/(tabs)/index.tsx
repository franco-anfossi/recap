import { EntryCard, EntryForm } from '@/components/entry';
import { MoodFace } from '@/components/mood';
import { StreakPill } from '@/components/streak';
import { Ionicons } from '@expo/vector-icons';
import { toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { fmt, fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { calculateCurrentStreak, greetingForHour } from '@/lib/streak';
import { useAuthStore, useEntriesStore } from '@/stores';
import { format, isSameDay, subDays } from 'date-fns';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { entries, fetchEntriesByDateRange } = useEntriesStore();

  useEffect(() => {
    const today = new Date();
    fetchEntriesByDateRange(
      format(subDays(today, 400), 'yyyy-MM-dd'),
      format(today, 'yyyy-MM-dd')
    );
  }, [fetchEntriesByDateRange]);

  const streak = useMemo(() => calculateCurrentStreak(entries), [entries]);

  const now = new Date();
  const firstName = user?.display_name?.trim().split(' ')[0];
  const greeting = `${greetingForHour(now.getHours())}${firstName ? `, ${firstName}` : ''}.`;

  const week = useMemo(() => {
    const byDate = new Map(entries.map((e) => [e.entry_date, e]));
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const key = format(date, 'yyyy-MM-dd');
      return { date, key, entry: byDate.get(key), isToday: isSameDay(date, now) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{fmtCap(now, t('today.dates.long'))}</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        <StreakPill streak={streak} />
      </View>

      <View style={styles.week}>
        {week.map((day) => (
          <Pressable
            key={day.key}
            style={styles.day}
            disabled={day.isToday}
            accessibilityRole="button"
            accessibilityLabel={t(day.entry ? 'today.home.dayLogged' : 'today.home.dayEmpty', {
              day: fmtCap(day.date, t('today.dates.weekdayWithDay')),
            })}
            onPress={() =>
              day.entry
                ? router.push(`/entry/${day.entry.id}`)
                : router.push({ pathname: '/entry/new', params: { date: day.key } })
            }
          >
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {fmtCap(day.date, 'EEEEE')}
            </Text>
            <View style={[styles.daySlot, day.isToday && styles.daySlotToday]}>
              {day.entry ? (
                <MoodFace mood={toMoodLevel(day.entry.mood)} size={30} />
              ) : (
                <View style={[styles.dayEmpty, day.isToday && styles.dayEmptyToday]} />
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const latest = week
    .slice(0, -1)
    .reverse()
    .find((d) => d.entry)?.entry;
  const missed = week.slice(0, -1).reverse().find((d) => !d.entry);

  const emptyFooter = (
    <View style={styles.footer}>
      {latest && (
        <View style={styles.footerBlock}>
          <Text style={styles.footerLabel}>{t('today.home.lastCheckIn')}</Text>
          <EntryCard entry={latest} onPress={() => router.push(`/entry/${latest.id}`)} />
        </View>
      )}
      {missed && (
        <Pressable
          onPress={() => router.push({ pathname: '/entry/new', params: { date: missed.key } })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.missed, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.missedIcon}>
            <Ionicons name="calendar-outline" size={16} color={colors.brand} />
          </View>
          <Text style={styles.missedText}>
            {t('today.home.missedDay', { day: fmt(missed.date, 'EEEE') })}{' '}
            <Text style={styles.missedLink}>{t('today.home.addItNow')}</Text>
          </Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <EntryForm header={header} emptyFooter={emptyFooter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...type.label,
    color: colors.brand,
  },
  greeting: {
    ...type.display,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  day: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  dayLabel: {
    ...type.caption,
    fontFamily: fonts.sansSemibold,
  },
  dayLabelToday: {
    color: colors.brand,
  },
  daySlot: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySlotToday: {
    borderWidth: 2,
    borderColor: colors.brand,
  },
  dayEmpty: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dayEmptyToday: {
    backgroundColor: colors.brandSoft,
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  footerBlock: {
    gap: spacing.sm,
  },
  footerLabel: {
    ...type.label,
  },
  missed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    backgroundColor: colors.brandTint,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.s12,
  },
  missedIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedText: {
    ...type.subhead,
    color: colors.ink,
    flex: 1,
  },
  missedLink: {
    fontFamily: fonts.sansSemibold,
    color: colors.brandStrong,
  },
});

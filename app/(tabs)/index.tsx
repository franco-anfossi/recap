import { EntryForm } from '@/components/entry';
import { MoodFace } from '@/components/mood';
import { StreakPill } from '@/components/streak';
import { toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
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
          <Text style={styles.eyebrow}>{format(now, 'EEEE, MMMM d')}</Text>
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
            accessibilityLabel={`${format(day.date, 'EEEE d')}${day.entry ? ', logged' : ', no entry'}`}
            onPress={() =>
              day.entry
                ? router.push(`/entry/${day.entry.id}`)
                : router.push({ pathname: '/entry/new', params: { date: day.key } })
            }
          >
            <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
              {format(day.date, 'EEEEE')}
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

  return (
    <View style={styles.container}>
      <EntryForm header={header} />
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
});

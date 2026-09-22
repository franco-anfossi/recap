import { MoodFace } from '@/components/mood';
import { IconButton, Pill, Screen, ScreenHeader } from '@/components/ui';
import { MOODS, MOOD_LEVELS, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { fmt, fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { useEntriesStore } from '@/stores';
import { Entry } from '@/types';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isFuture,
  isPast,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// Localized single-letter weekday headers, Sunday first (2026-01-04 is a Sunday).
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => fmt(new Date(2026, 0, 4 + i), 'EEEEE').toUpperCase());

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const { entries, fetchEntriesByMonth } = useEntriesStore();
  const today = new Date();
  const isViewingCurrentMonth = isSameMonth(currentMonth, today) || currentMonth > today;

  useEffect(() => {
    fetchEntriesByMonth(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }, [currentMonth, fetchEntriesByMonth]);

  const goToPreviousMonth = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
    setCurrentMonth((m) => subMonths(m, 1));
  };
  const goToNextMonth = () => {
    if (isViewingCurrentMonth) return;
    if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
    setCurrentMonth((m) => addMonths(m, 1));
  };

  const { cells, monthEntries } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const byDate = new Map(entries.map((e) => [e.entry_date, e]));
    const leading: (Date | null)[] = Array(getDay(monthStart)).fill(null);
    const list: (Date | null)[] = [...leading, ...days];
    while (list.length % 7 !== 0) list.push(null);

    const monthEntries = days
      .map((d) => byDate.get(format(d, 'yyyy-MM-dd')))
      .filter((e): e is Entry => Boolean(e));

    return {
      cells: list.map((date) => ({
        date,
        entry: date ? byDate.get(format(date, 'yyyy-MM-dd')) : undefined,
      })),
      monthEntries,
    };
  }, [currentMonth, entries]);

  const summary = useMemo(() => {
    if (monthEntries.length === 0) return null;
    const avg = monthEntries.reduce((s, e) => s + e.mood, 0) / monthEntries.length;
    const counts = MOOD_LEVELS.map((l) => ({ level: l, count: monthEntries.filter((e) => e.mood === l).length }));
    const top = counts.sort((a, b) => b.count - a.count)[0];
    return { avg, top: top.level, count: monthEntries.length };
  }, [monthEntries]);

  const handleDayPress = (date: Date, entry?: Entry) => {
    if (isFuture(date)) return;
    if (entry) {
      router.push(`/entry/${entry.id}`);
    } else {
      router.push({ pathname: '/entry/new', params: { date: format(date, 'yyyy-MM-dd') } });
    }
  };

  return (
    <Screen>
      <ScreenHeader
        eyebrow={fmt(currentMonth, 'yyyy')}
        title={fmtCap(currentMonth, 'MMMM')}
        right={
          <View style={styles.nav}>
            <IconButton name="chevron-back" onPress={goToPreviousMonth} label={t('insights.calendar.previousMonth')} />
            <View style={isViewingCurrentMonth && styles.navDisabled}>
              <IconButton name="chevron-forward" onPress={goToNextMonth} label={t('insights.calendar.nextMonth')} />
            </View>
          </View>
        }
      />

      <View style={styles.calendar}>
        <View style={styles.weekdays}>
          {WEEKDAYS.map((d, i) => (
            <Text key={`${d}-${i}`} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <Animated.View key={format(currentMonth, 'yyyy-MM')} entering={FadeIn.duration(200)} style={styles.grid}>
          {cells.map(({ date, entry }, index) => {
            if (!date) return <View key={`empty-${index}`} style={styles.cell} />;

            const current = isToday(date);
            const future = isFuture(date) && !current;
            const missed = isPast(date) && !current && !entry;
            const mood = entry ? toMoodLevel(entry.mood) : null;

            return (
              <Pressable
                key={date.toISOString()}
                style={styles.cell}
                onPress={() => handleDayPress(date, entry)}
                disabled={future}
                accessibilityRole="button"
                accessibilityLabel={
                  mood
                    ? t('insights.calendar.dayLabel', { date: fmtCap(date, t('insights.dates.monthDay')), mood: MOODS[mood].label })
                    : fmtCap(date, t('insights.dates.monthDay'))
                }
              >
                <View style={[styles.cellInner, current && styles.cellToday]}>
                  {mood ? (
                    <MoodFace mood={mood} size={34} />
                  ) : (
                    <Text
                      style={[
                        styles.dayNumber,
                        future && styles.dayNumberFuture,
                        missed && styles.dayNumberMissed,
                        current && styles.dayNumberToday,
                      ]}
                    >
                      {format(date, 'd')}
                    </Text>
                  )}
                </View>
                {mood && (
                  <Text style={[styles.dayCaption, current && styles.dayNumberToday]}>{format(date, 'd')}</Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      {summary ? (
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <MoodFace mood={summary.top} size={44} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>
                {t('insights.calendar.summary.title', { mood: MOODS[summary.top].label.toLowerCase() })}
              </Text>
              <Text style={styles.summarySub}>
                {t('insights.calendar.summary.subtitle', { count: summary.count, avg: summary.avg.toFixed(1) })}
              </Text>
            </View>
          </View>
          <View style={styles.legend}>
            {MOOD_LEVELS.map((level) => (
              <View key={level} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MOODS[level].color }]} />
                <Text style={styles.legendText}>{MOODS[level].label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.summaryEmpty}>
          <Pill label={t('insights.calendar.empty.pill')} tone="muted" icon="calendar-outline" />
          <Text style={styles.summaryHint}>{t('insights.calendar.empty.hint')}</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  navDisabled: {
    opacity: 0.35,
  },
  calendar: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  weekdays: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...type.caption,
    fontFamily: fonts.sansSemibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: 2,
  },
  cellInner: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: colors.brand,
  },
  dayNumber: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  dayNumberToday: {
    color: colors.brand,
    fontFamily: fonts.sansBold,
  },
  dayNumberFuture: {
    color: colors.inkMuted,
    opacity: 0.6,
  },
  dayNumberMissed: {
    color: colors.inkMuted,
  },
  dayCaption: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 12,
    color: colors.inkMuted,
  },
  summary: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
  },
  summaryText: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    ...type.title3,
  },
  summarySub: {
    ...type.footnote,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    ...type.caption,
  },
  summaryEmpty: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryHint: {
    ...type.footnote,
    color: colors.inkMuted,
  },
});

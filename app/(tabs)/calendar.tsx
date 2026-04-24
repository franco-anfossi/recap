import { MOODS, toMoodLevel } from '@/constants/moods';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useEntriesStore } from '@/stores';
import { Entry } from '@/types';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isFuture, isPast, isToday, startOfMonth, subMonths } from 'date-fns';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CALENDAR_PADDING = spacing.md;
const DAY_SIZE = (SCREEN_WIDTH - CALENDAR_PADDING * 2) / 7;

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { entries, fetchEntriesByMonth } = useEntriesStore();
  const today = new Date();
  const isViewingCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() >= today.getMonth();

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    fetchEntriesByMonth(year, month);
  }, [currentMonth, fetchEntriesByMonth]);

  const goToPreviousMonth = () => setCurrentMonth((month) => subMonths(month, 1));
  const goToNextMonth = () => {
    if (!isViewingCurrentMonth) {
      setCurrentMonth((month) => addMonths(month, 1));
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const calendarDays = [...Array(startDayOfWeek).fill(null), ...daysInMonth];

  const totalCells = 42;
  while (calendarDays.length < totalCells) {
    calendarDays.push(null);
  }

  const getEntryForDate = (date: Date): Entry | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(e => e.entry_date === dateStr);
  };

  const handleDayPress = (date: Date) => {
    if (isFuture(date)) return; // Can't interact with future dates

    const entry = getEntryForDate(date);
    if (entry) {
      router.push(`/entry/${entry.id}`);
    } else if (isToday(date)) {
      router.push('/(tabs)');
    }
  };

  const headerHeight = 60;
  const availableHeight = SCREEN_HEIGHT - headerHeight - 200;
  const rowHeight = availableHeight / 6;

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Text style={styles.navText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.navButton, isViewingCurrentMonth && styles.navButtonDisabled]}
          disabled={isViewingCurrentMonth}
        >
          <Text style={[styles.navText, isViewingCurrentMonth && styles.navTextDisabled]}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {calendarDays.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={[styles.dayCell, { height: rowHeight }]} />;
          }

          const entry = getEntryForDate(date);
          const isCurrentDay = isToday(date);
          const isFutureDay = isFuture(date);
          const isPastDay = isPast(date) && !isCurrentDay;
          const dayNumber = format(date, 'd');
          const moodInfo = entry ? MOODS[toMoodLevel(entry.mood)] : null;

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayCell,
                { height: rowHeight },
                isCurrentDay && styles.todayCell,
                isFutureDay && styles.futureCell,
              ]}
              onPress={() => handleDayPress(date)}
              activeOpacity={isFutureDay ? 1 : 0.7}
              disabled={isFutureDay}
            >
              <Text style={[
                styles.dayNumber,
                isCurrentDay && styles.todayNumber,
                isFutureDay && styles.futureNumber,
                isPastDay && !entry && styles.pastMissedNumber,
                entry && styles.dayWithEntry,
              ]}>
                {dayNumber}
              </Text>

              {moodInfo && (
                <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
              )}

              {/* Show a subtle indicator for past days without entries */}
              {isPastDay && !entry && (
                <View style={styles.missedDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 24,
    color: colors.primary[500],
    fontWeight: typography.weights.bold,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navTextDisabled: {
    color: colors.gray[400],
  },
  monthTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  weekdays: {
    flexDirection: 'row',
    paddingHorizontal: CALENDAR_PADDING,
    marginBottom: spacing.xs,
  },
  weekday: {
    width: DAY_SIZE,
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
  },
  calendar: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CALENDAR_PADDING,
  },
  dayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  todayCell: {
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.md,
  },
  futureCell: {
    opacity: 0.8,
  },
  dayNumber: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  todayNumber: {
    color: colors.primary[600],
    fontWeight: typography.weights.bold,
  },
  futureNumber: {
    color: colors.gray[400],
    fontWeight: typography.weights.regular,
  },
  pastMissedNumber: {
    color: colors.gray[400],
  },
  dayWithEntry: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  moodEmoji: {
    fontSize: 24,
    marginTop: spacing.xs,
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    marginTop: spacing.xs,
  },
});

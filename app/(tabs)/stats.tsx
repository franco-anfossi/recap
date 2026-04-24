import { getMoodColor, getMoodInfo, toMoodLevel } from '@/constants/moods';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useEntriesStore } from '@/stores';
import { Entry } from '@/types';
import { eachDayOfInterval, endOfMonth, endOfYear, format, getDay, isFuture, startOfMonth, startOfYear } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ViewMode = 'year' | 'month-stripes';

export default function StatsScreen() {
  const { entries, fetchEntriesByYear } = useEntriesStore();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const isViewingCurrentYear = currentYear >= new Date().getFullYear();

  useEffect(() => {
    fetchEntriesByYear(currentYear);
  }, [currentYear, fetchEntriesByYear]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your Mood Patterns</Text>
          <View style={styles.yearControls}>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={() => setCurrentYear((year) => year - 1)}
            >
              <Text style={styles.yearButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.yearText}>{currentYear}</Text>
            <TouchableOpacity
              style={[styles.yearButton, isViewingCurrentYear && styles.yearButtonDisabled]}
              onPress={() => setCurrentYear((year) => year + 1)}
              disabled={isViewingCurrentYear}
            >
              <Text style={[styles.yearButtonText, isViewingCurrentYear && styles.yearButtonTextDisabled]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.toggles}>
          <TouchableOpacity
            style={[styles.toggle, viewMode === 'year' && styles.toggleActive]}
            onPress={() => setViewMode('year')}
          >
            <Text style={[styles.toggleText, viewMode === 'year' && styles.toggleTextActive]}>Yearly Heatmap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, viewMode === 'month-stripes' && styles.toggleActive]}
            onPress={() => setViewMode('month-stripes')}
          >
            <Text style={[styles.toggleText, viewMode === 'month-stripes' && styles.toggleTextActive]}>Monthly Stripes</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MonthlyAverageChart entries={entries} />

      {viewMode === 'year' && <YearlyHeatmap entries={entries} year={currentYear} />}
      {viewMode === 'month-stripes' && <MonthlyStripes entries={entries} year={currentYear} />}

      <MoodStats entries={entries} />
    </ScrollView>
  );
}

function MonthlyAverageChart({ entries }: { entries: Entry[] }) {
  const averages = React.useMemo(() => {
    const months = Array(12).fill(0).map(() => ({ sum: 0, count: 0 }));
    entries.forEach(e => {
      const monthIndex = parseInt(e.entry_date.split('-')[1], 10) - 1;
      if (months[monthIndex]) {
        months[monthIndex].sum += e.mood;
        months[monthIndex].count += 1;
      }
    });
    return months.map(m => m.count > 0 ? m.sum / m.count : 0);
  }, [entries]);

  const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const maxAverage = 5;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monthly Average</Text>
      <View style={styles.chartContainer}>
        {averages.map((avg, index) => {
          const height = (avg / maxAverage) * 100;
          const moodInfo = avg > 0 ? getMoodInfo(toMoodLevel(avg)) : null;

          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barTrack}>
                {avg > 0 && (
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${height}%`,
                        backgroundColor: moodInfo?.color || colors.primary[200]
                      }
                    ]}
                  />
                )}
              </View>
              <Text style={styles.barLabel}>{monthNames[index]}</Text>
              {avg > 0 && <Text style={styles.barValue}>{avg.toFixed(1)}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function YearlyHeatmap({ entries, year }: { entries: Entry[], year: number }) {
  const start = startOfYear(new Date(year, 0, 1));
  const end = endOfYear(new Date(year, 0, 1));
  const days = eachDayOfInterval({ start, end });

  // Group by week for column layout
  // We need to pad the start to align with Sunday/Monday
  const startDay = getDay(start); // 0 = Sunday
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const weeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  const getEntry = (date: Date) => entries.find(e => e.entry_date === format(date, 'yyyy-MM-dd'));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{year} Overview</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.heatmap}>
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={styles.heatmapColumn}>
              {week.map((date, dIndex) => {
                if (!date) return <View key={dIndex} style={styles.heatmapCellEmpty} />;
                const entry = getEntry(date);
                const color = entry ? getMoodColor(toMoodLevel(entry.mood)) : colors.gray[200];
                return (
                  <View
                    key={date.toISOString()}
                    style={[
                      styles.heatmapCell,
                      { backgroundColor: color },
                      !entry && { opacity: 0.3 }
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MonthlyStripes({ entries, year }: { entries: Entry[], year: number }) {
  // Just showing current month for now as an example, but could loop through all
  const currentMonth = new Date().getMonth();
  const start = startOfMonth(new Date(year, currentMonth, 1));
  const end = endOfMonth(new Date(year, currentMonth, 1));
  const days = eachDayOfInterval({ start, end });

  const getEntry = (date: Date) => entries.find(e => e.entry_date === format(date, 'yyyy-MM-dd'));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{format(start, 'MMMM')} Vibes</Text>
      <View style={styles.stripesContainer}>
        {days.map((date, index) => {
          if (isFuture(date)) return null;
          const entry = getEntry(date);
          const color = entry ? getMoodColor(toMoodLevel(entry.mood)) : colors.gray[200];
          return (
            <View
              key={date.toISOString()}
              style={[
                styles.stripe,
                { backgroundColor: color, height: 40, flex: 1 }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function MoodStats({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) return null;

  const total = entries.length;
  const moodCounts = entries.reduce((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Breakdown</Text>
      <View style={styles.statsGrid}>
        {[5, 4, 3, 2, 1].map((mood) => {
          const count = moodCounts[mood] || 0;
          const percentage = Math.round((count / total) * 100);
          const info = getMoodInfo(toMoodLevel(mood));

          return (
            <View key={mood} style={styles.statRow}>
              <Text style={styles.statEmoji}>{info.emoji}</Text>
              <View style={styles.statBarContainer}>
                <View style={[styles.statBar, { width: `${percentage}%`, backgroundColor: info.color }]} />
              </View>
              <Text style={styles.statLabel}>{percentage}%</Text>
            </View>
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
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  titleRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  yearControls: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: 2,
  },
  yearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  yearButtonDisabled: {
    opacity: 0.35,
  },
  yearButtonText: {
    fontSize: 22,
    color: colors.primary[600],
    fontWeight: typography.weights.bold,
  },
  yearButtonTextDisabled: {
    color: colors.gray[400],
  },
  yearText: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  toggles: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    padding: 4,
    borderRadius: borderRadius.md,
  },
  toggle: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  toggleTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  section: {
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  // Heatmap styles
  heatmap: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapColumn: {
    gap: 4,
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatmapCellEmpty: {
    width: 12,
    height: 12,
  },
  // Stripe styles
  stripesContainer: {
    flexDirection: 'row',
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  stripe: {
    // flex: 1 handled inline
  },
  // Stats styles
  statsGrid: {
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statEmoji: {
    fontSize: 20,
    width: 30,
  },
  statBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: 4,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    width: 40,
    textAlign: 'right',
  },
  // Chart styles
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: spacing.md,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  barTrack: {
    width: 8,
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 8,
    color: colors.text.muted,
    position: 'absolute',
    top: -15,
  },
});

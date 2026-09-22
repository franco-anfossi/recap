import { MoodFace } from '@/components/mood';
import { EmptyState, IconButton, Screen, ScreenHeader, StatTile } from '@/components/ui';
import { MOODS, MOOD_LEVELS, MoodLevel, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { calculateCurrentStreak, calculateLongestStreak } from '@/lib/streak';
import { useEntriesStore } from '@/stores';
import { Entry } from '@/types';
import {
  eachDayOfInterval,
  endOfYear,
  format,
  getDay,
  isAfter,
  parseISO,
  startOfYear,
} from 'date-fns';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StatsScreen() {
  const { entries, fetchEntriesByYear } = useEntriesStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const isCurrentYear = year >= new Date().getFullYear();

  useEffect(() => {
    fetchEntriesByYear(year);
  }, [year, fetchEntriesByYear]);

  const yearEntries = useMemo(
    () => entries.filter((e) => e.entry_date.startsWith(String(year))),
    [entries, year]
  );

  const summary = useMemo(() => buildSummary(yearEntries, year), [yearEntries, year]);

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Insights"
        title={String(year)}
        subtitle={summary ? `${summary.total} check-ins · ${summary.daysCovered}% of days so far` : undefined}
        right={
          <View style={styles.nav}>
            <IconButton name="chevron-back" onPress={() => setYear((y) => y - 1)} label="Previous year" />
            <View style={isCurrentYear && styles.navDisabled}>
              <IconButton name="chevron-forward" onPress={() => !isCurrentYear && setYear((y) => y + 1)} label="Next year" />
            </View>
          </View>
        }
      />

      {!summary ? (
        <EmptyState
          icon="stats-chart-outline"
          title={`Nothing logged in ${year}`}
          message="Insights appear once you have a few check-ins. Start with today."
          action={isCurrentYear ? { label: 'Log today', onPress: () => router.navigate('/(tabs)') } : undefined}
          style={styles.empty}
        />
      ) : (
        <>
          <View style={styles.tiles}>
            <StatTile
              label="Average"
              value={summary.avg.toFixed(1)}
              hint={MOODS[toMoodLevel(summary.avg)].label}
              accent={MOODS[toMoodLevel(summary.avg)].ink}
            />
            <StatTile
              label="Best month"
              value={summary.bestMonth ? MONTHS_LONG[summary.bestMonth.index].slice(0, 3) : '–'}
              hint={summary.bestMonth ? `${summary.bestMonth.avg.toFixed(1)} avg` : undefined}
            />
          </View>
          <View style={[styles.tiles, { marginTop: spacing.sm }]}>
            <StatTile label="Current streak" value={`${summary.streak}d`} accent={summary.streak > 0 ? colors.brandStrong : undefined} />
            <StatTile label="Longest streak" value={`${summary.longest}d`} />
          </View>

          <Section title="Month by month" caption="Average mood per month">
            <MonthlyChart averages={summary.monthly} />
          </Section>

          <Section title="The year in days" caption="One square per day">
            <YearHeatmap entries={yearEntries} year={year} />
          </Section>

          <Section title="Breakdown" caption="How often each mood showed up">
            <Breakdown counts={summary.counts} total={summary.total} />
          </Section>

          {summary.bestDay && (
            <View style={styles.highlight}>
              <MoodFace mood={5} size={40} />
              <View style={styles.highlightText}>
                <Text style={styles.highlightTitle}>Great days: {summary.counts[5]}</Text>
                <Text style={styles.highlightSub}>
                  Most recent on {format(parseISO(summary.bestDay.entry_date), 'MMMM d')}
                  {summary.bestDay.note ? ` — “${summary.bestDay.note.slice(0, 60)}${summary.bestDay.note.length > 60 ? '…' : ''}”` : ''}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

function buildSummary(entries: Entry[], year: number) {
  if (entries.length === 0) return null;

  const total = entries.length;
  const avg = entries.reduce((s, e) => s + e.mood, 0) / total;

  const monthly = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));
  entries.forEach((e) => {
    const m = parseInt(e.entry_date.split('-')[1], 10) - 1;
    monthly[m].sum += e.mood;
    monthly[m].count += 1;
  });
  const averages = monthly.map((m) => (m.count > 0 ? m.sum / m.count : 0));

  let bestMonth: { index: number; avg: number } | null = null;
  averages.forEach((a, i) => {
    if (a > 0 && (!bestMonth || a > bestMonth.avg)) bestMonth = { index: i, avg: a };
  });

  const counts = MOOD_LEVELS.reduce(
    (acc, l) => ({ ...acc, [l]: entries.filter((e) => e.mood === l).length }),
    {} as Record<MoodLevel, number>
  );

  const bestDay = entries
    .filter((e) => e.mood === 5)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0];

  const now = new Date();
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(yearStart);
  const lastDay = isAfter(now, yearEnd) ? yearEnd : now;
  const daysSoFar = Math.max(1, eachDayOfInterval({ start: yearStart, end: lastDay }).length);

  return {
    total,
    avg,
    monthly: averages,
    bestMonth: bestMonth as { index: number; avg: number } | null,
    counts,
    bestDay,
    streak: calculateCurrentStreak(entries),
    longest: calculateLongestStreak(entries),
    daysCovered: Math.min(100, Math.round((total / daysSoFar) * 100)),
  };
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function Section({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {caption && <Text style={styles.sectionCaption}>{caption}</Text>}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function MonthlyChart({ averages }: { averages: number[] }) {
  return (
    <View style={styles.chart}>
      {averages.map((avg, i) => {
        const level = avg > 0 ? toMoodLevel(avg) : null;
        const height = avg > 0 ? Math.max(6, (avg / 5) * 100) : 0;
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              {level && (
                <View style={[styles.bar, { height: `${height}%`, backgroundColor: MOODS[level].color }]} />
              )}
            </View>
            <Text style={styles.barLabel}>{MONTHS_SHORT[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function YearHeatmap({ entries, year }: { entries: Entry[]; year: number }) {
  const weeks = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(start);
    const days = eachDayOfInterval({ start, end });
    const byDate = new Map(entries.map((e) => [e.entry_date, e]));
    const padded: (Date | null)[] = [...Array(getDay(start)).fill(null), ...days];
    const cols: { date: Date | null; mood: MoodLevel | null; future: boolean }[][] = [];
    const today = new Date();
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(
        padded.slice(i, i + 7).map((date) => {
          if (!date) return { date: null, mood: null, future: false };
          const entry = byDate.get(format(date, 'yyyy-MM-dd'));
          return { date, mood: entry ? toMoodLevel(entry.mood) : null, future: isAfter(date, today) };
        })
      );
    }
    return cols;
  }, [entries, year]);

  // Month labels: position of first week that contains day 1 of each month.
  const monthMarks = useMemo(() => {
    const marks: { label: string; col: number }[] = [];
    weeks.forEach((week, col) => {
      week.forEach((cell) => {
        if (cell.date && cell.date.getDate() === 1) {
          marks.push({ label: format(cell.date, 'MMM'), col });
        }
      });
    });
    return marks;
  }, [weeks]);

  const CELL = 11;
  const GAP = 3;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heatmapScroll}>
      <View>
        <View style={[styles.heatmapMonths, { height: 16 }]}>
          {monthMarks.map((m) => (
            <Text key={m.label} style={[styles.heatmapMonth, { left: m.col * (CELL + GAP) }]}>
              {m.label}
            </Text>
          ))}
        </View>
        <View style={[styles.heatmap, { gap: GAP }]}>
          {weeks.map((week, w) => (
            <View key={w} style={{ gap: GAP }}>
              {week.map((cell, d) => (
                <View
                  key={d}
                  style={[
                    styles.heatCell,
                    { width: CELL, height: CELL },
                    cell.date === null && { backgroundColor: 'transparent' },
                    cell.mood !== null && { backgroundColor: MOODS[cell.mood].color },
                    cell.future && { backgroundColor: colors.surfaceMuted, opacity: 0.5 },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Breakdown({ counts, total }: { counts: Record<MoodLevel, number>; total: number }) {
  return (
    <View style={styles.breakdown}>
      {[5, 4, 3, 2, 1].map((level) => {
        const l = level as MoodLevel;
        const count = counts[l] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <View key={level} style={styles.breakRow}>
            <MoodFace mood={l} size={26} />
            <Text style={styles.breakLabel}>{MOODS[l].label}</Text>
            <View style={styles.breakTrack}>
              <View style={[styles.breakFill, { width: `${pct}%`, backgroundColor: MOODS[l].color }]} />
            </View>
            <Text style={styles.breakValue}>{pct}%</Text>
          </View>
        );
      })}
    </View>
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
  empty: {
    marginTop: spacing.xxl,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.s12,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    ...type.title2,
  },
  sectionCaption: {
    ...type.footnote,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    gap: spacing.xs,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    maxWidth: 18,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: radius.xs,
  },
  barLabel: {
    ...type.caption,
    fontSize: 10,
  },
  heatmapScroll: {
    paddingVertical: spacing.xs,
  },
  heatmapMonths: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  heatmapMonth: {
    position: 'absolute',
    ...type.caption,
    fontSize: 10,
  },
  heatmap: {
    flexDirection: 'row',
  },
  heatCell: {
    borderRadius: 3,
    backgroundColor: colors.surfaceSunken,
  },
  breakdown: {
    gap: spacing.s12,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breakLabel: {
    ...type.callout,
    fontSize: 14,
    width: 48,
  },
  breakTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  breakFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  breakValue: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.inkSecondary,
    width: 38,
    textAlign: 'right',
  },
  highlight: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    backgroundColor: MOODS[5].tint,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  highlightText: {
    flex: 1,
    gap: 2,
  },
  highlightTitle: {
    ...type.headline,
    color: MOODS[5].ink,
  },
  highlightSub: {
    ...type.footnote,
    color: MOODS[5].ink,
    opacity: 0.85,
  },
});

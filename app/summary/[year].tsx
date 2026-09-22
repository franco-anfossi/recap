import { BurnerBalance } from '@/components/burners';
import { MoodFace } from '@/components/mood';
import { Button, ModalHeader, Wordmark } from '@/components/ui';
import { Burner, BURNER_KEYS, BURNERS, isBurner } from '@/constants/burners';
import { MOODS, MOOD_LEVELS, MoodLevel, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, shadows, spacing, type } from '@/constants/theme';
import * as entriesApi from '@/lib/api/entries';
import { fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { calculateLongestStreak } from '@/lib/streak';
import { useAuthStore, useEntriesStore, useGoalsStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MonthlyStat {
  month: number;
  average: number;
  count: number;
}

interface YearStats {
  totalEntries: number;
  averageMood: number;
  moodDistribution: Record<number, number>;
  monthlyAverages: MonthlyStat[];
}

// Localized month labels (index 0 = January): single initial for the chart, full name for sentences.
const MONTHS_LONG = Array.from({ length: 12 }, (_, i) => fmtCap(new Date(2026, i, 1), 'MMMM'));
const MONTHS_INITIAL = MONTHS_LONG.map((m) => m.charAt(0));

export default function YearlySummaryScreen() {
  const insets = useSafeAreaInsets();
  const { year: yearParam } = useLocalSearchParams<{ year: string }>();
  const year = parseInt(yearParam || new Date().getFullYear().toString(), 10);
  const isCurrentYear = year === new Date().getFullYear();

  const { entries, fetchEntriesByYear } = useEntriesStore();
  const { goals, fetchGoals } = useGoalsStore();
  const dimmed = useAuthStore((s) => s.user?.dimmed_burner ?? null);
  const [stats, setStats] = useState<YearStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await entriesApi.getEntryStats(year);
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchEntriesByYear(year);
    fetchGoals(year);
    loadStats();
  }, [fetchEntriesByYear, fetchGoals, loadStats, year]);

  const yearEntries = useMemo(() => entries.filter((e) => e.entry_date.startsWith(String(year))), [entries, year]);

  const insights = useMemo(() => {
    if (!stats || stats.totalEntries === 0) return null;
    const active = stats.monthlyAverages.filter((m) => m.count > 0);
    const best = active.reduce<MonthlyStat | null>((b, m) => (!b || m.average > b.average ? m : b), null);
    const busiest = active.reduce<MonthlyStat | null>((b, m) => (!b || m.count > b.count ? m : b), null);
    const [topMoodRaw, topMoodCount] =
      Object.entries(stats.moodDistribution).sort(([, a], [, b]) => b - a)[0] ?? ['3', 0];
    const topMood = toMoodLevel(Number(topMoodRaw));
    const longest = calculateLongestStreak(yearEntries);
    const completedGoals = goals.filter((g) => g.is_completed);
    const greatDays = stats.moodDistribution[5] || 0;

    const burnerCounts = BURNER_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: yearEntries.filter((e) => (e.burners || []).includes(key)).length }),
      {} as Record<Burner, number>
    );
    const taggedDays = yearEntries.filter((e) => (e.burners || []).some(isBurner)).length;
    const topBurner = [...BURNER_KEYS].sort((a, b) => burnerCounts[b] - burnerCounts[a])[0];

    return { best, busiest, topMood, topMoodCount, longest, completedGoals, greatDays, burnerCounts, taggedDays, topBurner };
  }, [stats, yearEntries, goals]);

  const avgLevel: MoodLevel = stats && stats.averageMood > 0 ? toMoodLevel(stats.averageMood) : 4;

  return (
    <View style={styles.container}>
      <ModalHeader />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroCard}>
          <LinearGradient
            colors={['#FFB27C', '#F26A1B', '#8C340B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <Wordmark size={20} tone="onBrand" />
              <Text style={styles.heroEyebrow}>
                {isCurrentYear ? t('insights.summary.hero.soFar') : t('insights.summary.hero.yearInReview')}
              </Text>
            </View>
            <Text style={styles.heroYear}>{year}</Text>
            <Text style={styles.heroTitle}>
              {stats && stats.totalEntries > 0
                ? t('insights.summary.hero.titleMood', { word: MOODS[avgLevel].word })
                : t('insights.summary.hero.titleEmpty')}
            </Text>
            <View style={styles.heroFace}>
              <MoodFace mood={avgLevel} size={72} />
            </View>
          </LinearGradient>
        </Animated.View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.spinner} />
        ) : stats && stats.totalEntries > 0 && insights ? (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.tiles}>
              <BigStat value={String(stats.totalEntries)} label={t('insights.summary.bigStats.checkIns')} />
              <BigStat value={stats.averageMood.toFixed(1)} label={t('insights.summary.bigStats.averageMood')} accent={MOODS[avgLevel].ink} />
              <BigStat value={t('insights.summary.bigStats.days', { count: insights.longest })} label={t('insights.summary.bigStats.bestStreak')} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.card}>
              <Text style={styles.cardTitle}>{t('insights.summary.monthly.title')}</Text>
              <View style={styles.chart}>
                {stats.monthlyAverages.map((m) => {
                  const level = m.average > 0 ? toMoodLevel(m.average) : null;
                  const h = m.average > 0 ? Math.max(6, (m.average / 5) * 100) : 0;
                  const isBest = insights.best?.month === m.month;
                  return (
                    <View key={m.month} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        {level && <View style={[styles.bar, { height: `${h}%`, backgroundColor: MOODS[level].color }]} />}
                      </View>
                      <Text style={[styles.barLabel, isBest && styles.barLabelBest]}>{MONTHS_INITIAL[m.month - 1]}</Text>
                    </View>
                  );
                })}
              </View>
              {insights.best && (
                <Text style={styles.cardNote}>
                  {t('insights.summary.monthly.bestMonthBefore')}
                  <Text style={styles.cardNoteStrong}>{MONTHS_LONG[insights.best.month - 1]}</Text>
                  {t('insights.summary.monthly.bestMonthAfter', { avg: insights.best.average.toFixed(1) })}
                </Text>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.card}>
              <Text style={styles.cardTitle}>{t('insights.summary.distribution.title')}</Text>
              <View style={styles.distribution}>
                {[...MOOD_LEVELS].reverse().map((level) => {
                  const count = stats.moodDistribution[level] || 0;
                  const pct = Math.round((count / stats.totalEntries) * 100);
                  return (
                    <View key={level} style={styles.distRow}>
                      <MoodFace mood={level} size={24} />
                      <View style={styles.distTrack}>
                        <View style={[styles.distFill, { width: `${Math.max(pct, count > 0 ? 3 : 0)}%`, backgroundColor: MOODS[level].color }]} />
                      </View>
                      <Text style={styles.distValue}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {insights.taggedDays > 0 && (
              <Animated.View entering={FadeInDown.delay(230).duration(400)} style={styles.card}>
                <Text style={styles.cardTitle}>{t('insights.summary.energy.title')}</Text>
                <BurnerBalance counts={insights.burnerCounts} totalDays={yearEntries.length} dimmed={dimmed} />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(260).duration(400)} style={styles.insights}>
              <Text style={styles.insightsTitle}>{t('insights.summary.stoodOut.title')}</Text>
              <InsightRow
                icon="happy-outline"
                text={t('insights.summary.stoodOut.topMood', {
                  mood: MOODS[insights.topMood].label.toLowerCase(),
                  count: insights.topMoodCount,
                })}
              />
              {insights.busiest && (
                <InsightRow
                  icon="calendar-outline"
                  text={t('insights.summary.stoodOut.busiestMonth', {
                    month: MONTHS_LONG[insights.busiest.month - 1],
                    count: insights.busiest.count,
                  })}
                />
              )}
              {insights.greatDays > 0 && (
                <InsightRow icon="sparkles-outline" text={t('insights.summary.stoodOut.greatDays', { count: insights.greatDays })} />
              )}
              {insights.taggedDays >= 5 && (
                <InsightRow
                  icon="flame-outline"
                  text={
                    dimmed
                      ? t(
                          insights.burnerCounts[dimmed] <= insights.burnerCounts[insights.topBurner] / 2
                            ? 'insights.summary.stoodOut.topBurnerDimmedShows'
                            : 'insights.summary.stoodOut.topBurnerDimmedPulled',
                          { top: BURNERS[insights.topBurner].label, dimmed: BURNERS[dimmed].label }
                        )
                      : t('insights.summary.stoodOut.topBurner', { burner: BURNERS[insights.topBurner].label })
                  }
                />
              )}
              {insights.longest >= 7 && (
                <InsightRow icon="flame-outline" text={t('insights.summary.stoodOut.longestStreak', { count: insights.longest })} />
              )}
              {goals.length > 0 && (
                <InsightRow
                  icon="flag-outline"
                  text={
                    insights.completedGoals.length > 0
                      ? t('insights.summary.stoodOut.goalsCompleted', {
                          done: insights.completedGoals.length,
                          count: goals.length,
                          titles: insights.completedGoals.map((g) => g.title).join(', '),
                        })
                      : t('insights.summary.stoodOut.goalsInProgress', { count: goals.length })
                  }
                />
              )}
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.empty}>
            <Text style={styles.emptyTitle}>{t('insights.summary.empty.title')}</Text>
            <Text style={styles.emptyText}>
              {isCurrentYear ? t('insights.summary.empty.currentYear') : t('insights.summary.empty.pastYear', { year })}
            </Text>
            {isCurrentYear && (
              <Button title={t('insights.summary.empty.action')} onPress={() => router.back()} icon="sunny-outline" />
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

function BigStat({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <View style={styles.bigStat}>
      <Text style={[styles.bigStatValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
    </View>
  );
}

function InsightRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.insightRow}>
      <View style={styles.insightIcon}>
        <Ionicons name={icon} size={16} color={colors.brand} />
      </View>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  spinner: {
    marginTop: spacing.xxl,
  },
  heroCard: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...shadows.brand,
  },
  hero: {
    padding: spacing.s20,
    minHeight: 220,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    ...type.label,
    color: '#FFE8D6',
  },
  heroYear: {
    fontFamily: fonts.displayBold,
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -3,
    color: colors.inkOnBrand,
    marginTop: spacing.lg,
  },
  heroTitle: {
    fontFamily: fonts.displayItalic,
    fontSize: 22,
    lineHeight: 28,
    color: '#FFE8D6',
    maxWidth: '70%',
  },
  heroFace: {
    position: 'absolute',
    right: spacing.s20,
    bottom: spacing.s20,
    width: 92,
    height: 92,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bigStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  bigStatValue: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  bigStatLabel: {
    ...type.caption,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: {
    ...type.title2,
  },
  cardNote: {
    ...type.subhead,
  },
  cardNoteStrong: {
    fontFamily: fonts.sansSemibold,
    color: colors.ink,
  },
  chart: {
    flexDirection: 'row',
    height: 120,
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
  barLabelBest: {
    color: colors.brand,
  },
  distribution: {
    gap: spacing.sm,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  distValue: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.inkSecondary,
    width: 32,
    textAlign: 'right',
  },
  insights: {
    backgroundColor: colors.brandTint,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.s12,
  },
  insightsTitle: {
    ...type.title2,
  },
  insightRow: {
    flexDirection: 'row',
    gap: spacing.s12,
    alignItems: 'flex-start',
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    ...type.body,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.s12,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    ...type.title2,
    textAlign: 'center',
  },
  emptyText: {
    ...type.subhead,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});

import { Button, Card } from '@/components/ui';
import { MOODS, toMoodLevel } from '@/constants/moods';
import { colors, spacing, typography } from '@/constants/theme';
import * as entriesApi from '@/lib/api/entries';
import { useEntriesStore } from '@/stores';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface MonthlyStat {
  month: number;
  average: number;
  count: number;
}

export default function YearlySummaryScreen() {
  const { year: yearParam } = useLocalSearchParams<{ year: string }>();
  const year = parseInt(yearParam || new Date().getFullYear().toString(), 10);

  const { fetchEntriesByYear, isLoading } = useEntriesStore();
  const [stats, setStats] = useState<{
    totalEntries: number;
    averageMood: number;
    moodDistribution: Record<number, number>;
    monthlyAverages: MonthlyStat[];
  } | null>(null);
  const [yearlyInsight, setYearlyInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadStats = useCallback(async () => {
    const data = await entriesApi.getEntryStats(year);
    setStats(data);
  }, [year]);

  useEffect(() => {
    fetchEntriesByYear(year);
    loadStats();
  }, [fetchEntriesByYear, loadStats, year]);

  const generateYearlyInsight = async () => {
    if (!stats) return;

    setIsGenerating(true);

    setTimeout(() => {
      const activeMonths = stats.monthlyAverages.filter((month) => month.count > 0);
      const bestMonth = activeMonths.reduce<MonthlyStat | null>((best, month) => {
        if (!best || month.average > best.average) return month;
        return best;
      }, null);
      const busiestMonth = activeMonths.reduce<MonthlyStat | null>((busiest, month) => {
        if (!busiest || month.count > busiest.count) return month;
        return busiest;
      }, null);
      const mostCommonMood = Object.entries(stats.moodDistribution)
        .sort(([, a], [, b]) => b - a)[0];
      const mostCommonMoodLevel = toMoodLevel(Number(mostCommonMood?.[0] || 0));
      const mostCommonMoodCount = mostCommonMood?.[1] || 0;

      const summary = [
        `Your average mood for ${year} was ${stats.averageMood.toFixed(1)}/5 across ${stats.totalEntries} entries.`,
        bestMonth
          ? `${monthNames[bestMonth.month - 1]} had your strongest average at ${bestMonth.average.toFixed(1)}/5.`
          : null,
        busiestMonth
          ? `${monthNames[busiestMonth.month - 1]} was your most consistent month with ${busiestMonth.count} entries.`
          : null,
        mostCommonMoodCount > 0
          ? `Your most frequent mood was ${MOODS[mostCommonMoodLevel].label.toLowerCase()} ${MOODS[mostCommonMoodLevel].emoji}, logged ${mostCommonMoodCount} times.`
          : null,
      ].filter(Boolean).join('\n\n');

      setYearlyInsight(summary);
      setIsGenerating(false);
    }, 400);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getMoodEmoji = (avg: number): string => {
    return avg > 0 ? MOODS[toMoodLevel(avg)].emoji : '📊';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{year} Recap</Text>
        <Text style={styles.subtitle}>Your year in emotions</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary[600]} />
        ) : stats && stats.totalEntries > 0 ? (
          <>
            {/* Overview Stats */}
            <View style={styles.statsRow}>
              <Card variant="elevated" padding="md" style={styles.statCard}>
                <Text style={styles.statEmoji}>📝</Text>
                <Text style={styles.statValue}>{stats.totalEntries}</Text>
                <Text style={styles.statLabel}>Entries</Text>
              </Card>

              <Card variant="elevated" padding="md" style={styles.statCard}>
                <Text style={styles.statEmoji}>{getMoodEmoji(stats.averageMood)}</Text>
                <Text style={styles.statValue}>{stats.averageMood.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Avg Mood</Text>
              </Card>
            </View>

            {/* Monthly Chart */}
            <Card variant="outlined" padding="lg" style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Monthly Mood Averages</Text>
              <View style={styles.chart}>
                {stats.monthlyAverages.map((month) => {
                  const height = (month.average / 5) * 100;
                  return (
                    <View key={month.month} style={styles.chartBar}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${height}%`,
                            backgroundColor: month.average > 0 ? MOODS[toMoodLevel(month.average)].color : colors.gray[300],
                          },
                        ]}
                      />
                      <Text style={styles.chartLabel}>
                        {monthNames[month.month - 1]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Mood Distribution */}
            <Card variant="outlined" padding="lg" style={styles.distributionCard}>
              <Text style={styles.sectionTitle}>Mood Distribution</Text>
              <View style={styles.distribution}>
                {([1, 2, 3, 4, 5] as const).map((level) => {
                  const count = stats.moodDistribution[level] || 0;
                  const percentage = stats.totalEntries > 0 ? Math.round((count / stats.totalEntries) * 100) : 0;

                  return (
                    <View key={level} style={styles.distributionItem}>
                      <Text style={styles.distributionEmoji}>{MOODS[level].emoji}</Text>
                      <View style={styles.distributionBar}>
                        <View
                          style={[
                            styles.distributionFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: MOODS[level].color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.distributionCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Yearly Insights */}
            <Card variant="elevated" padding="lg" style={styles.insightCard}>
              <Text style={styles.sectionTitle}>Yearly Insights</Text>
              {yearlyInsight ? (
                <Text style={styles.insightText}>{yearlyInsight}</Text>
              ) : (
                <View style={styles.insightPrompt}>
                  <Text style={styles.insightPromptText}>
                    Generate a grounded summary from your actual mood and journaling patterns.
                  </Text>
                  <Button
                    title={isGenerating ? 'Generating...' : 'Generate Insights'}
                    onPress={generateYearlyInsight}
                    loading={isGenerating}
                    disabled={isGenerating}
                  />
                </View>
              )}
            </Card>
          </>
        ) : (
          <Card variant="outlined" padding="lg" style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>
              No entries found for {year}. Start journaling to see your yearly recap!
            </Text>
            <Button
              title="Start Today's Entry"
              onPress={() => router.replace('/(tabs)')}
              variant="primary"
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  chartCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: spacing.md,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  distributionCard: {
    marginBottom: spacing.lg,
  },
  distribution: {
    gap: spacing.sm,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  distributionEmoji: {
    fontSize: 20,
    width: 28,
  },
  distributionBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 6,
  },
  distributionCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
  insightCard: {
    backgroundColor: colors.primary[50],
  },
  insightPrompt: {
    alignItems: 'center',
  },
  insightPromptText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  insightText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});

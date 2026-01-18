import { Button, Card } from '@/components/ui';
import { MOODS, MoodLevel } from '@/constants/moods';
import { colors, spacing, typography } from '@/constants/theme';
import * as entriesApi from '@/lib/api/entries';
import { useEntriesStore } from '@/stores';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const year = parseInt(yearParam || new Date().getFullYear().toString());

  const { entries, fetchEntriesByYear, isLoading } = useEntriesStore();
  const [stats, setStats] = useState<{
    totalEntries: number;
    averageMood: number;
    moodDistribution: Record<number, number>;
    monthlyAverages: MonthlyStat[];
  } | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchEntriesByYear(year);
    loadStats();
  }, [year]);

  const loadStats = async () => {
    const data = await entriesApi.getEntryStats(year);
    setStats(data);
  };

  const generateAISummary = async () => {
    setIsGenerating(true);
    // Simulate AI summary generation
    // In production, this would call a Supabase Edge Function
    setTimeout(() => {
      const summary = `Your ${year} was a journey of emotional growth! 

📈 **Overall Trend**: Your mood averaged ${stats?.averageMood.toFixed(1)}/5, with ${stats?.totalEntries} journal entries throughout the year.

🌟 **Highlights**: You showed remarkable consistency in maintaining your journal practice. Your best months tended to cluster during the warmer seasons.

💪 **Resilience**: Even during challenging periods, you demonstrated the ability to bounce back, with your mood typically recovering within a few days.

🎯 **Growth Areas**: Consider focusing on maintaining your journaling habit during busy weeks. Your entries during consistent periods show more emotional balance.

Keep journaling - self-reflection is the first step to emotional intelligence! 📓✨`;

      setAiSummary(summary);
      setIsGenerating(false);
    }, 2000);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getMoodEmoji = (avg: number): string => {
    const rounded = Math.round(avg) as MoodLevel;
    return MOODS[rounded]?.emoji || '📊';
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
                            backgroundColor: MOODS[Math.round(month.average) as MoodLevel]?.color || colors.gray[300],
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
                {([1, 2, 3, 4, 5] as MoodLevel[]).map((level) => {
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

            {/* AI Summary */}
            <Card variant="elevated" padding="lg" style={styles.aiCard}>
              <Text style={styles.sectionTitle}>✨ AI Summary</Text>
              {aiSummary ? (
                <Text style={styles.aiSummaryText}>{aiSummary}</Text>
              ) : (
                <View style={styles.aiPrompt}>
                  <Text style={styles.aiPromptText}>
                    Get a personalized AI analysis of your emotional journey this year.
                  </Text>
                  <Button
                    title={isGenerating ? 'Generating...' : 'Generate Summary'}
                    onPress={generateAISummary}
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
  aiCard: {
    backgroundColor: colors.primary[50],
  },
  aiPrompt: {
    alignItems: 'center',
  },
  aiPromptText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  aiSummaryText: {
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

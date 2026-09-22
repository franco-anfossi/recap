import { AddGoalModal, GoalItem } from '@/components/goals';
import { MoodFace } from '@/components/mood';
import {
  Avatar,
  ListGroup,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { MOODS, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, shadows, spacing, type } from '@/constants/theme';
import { calculateCurrentStreak } from '@/lib/streak';
import { useAuthStore, useEntriesStore, useGoalsStore, useSocialStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { entries, fetchEntriesByYear } = useEntriesStore();
  const { goals, fetchGoals, createGoal, toggleCompletion, deleteGoal } = useGoalsStore();
  const { stats: socialStats, fetchStats: fetchSocialStats } = useSocialStore();
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);

  const year = new Date().getFullYear();

  useEffect(() => {
    if (user?.id) {
      fetchEntriesByYear(year);
      fetchGoals(year);
      fetchSocialStats(user.id);
    }
  }, [fetchEntriesByYear, fetchGoals, fetchSocialStats, user?.id, year]);

  const yearEntries = useMemo(() => entries.filter((e) => e.entry_date.startsWith(String(year))), [entries, year]);

  const stats = useMemo(() => {
    const total = yearEntries.length;
    const avg = total > 0 ? yearEntries.reduce((s, e) => s + e.mood, 0) / total : 0;
    return { total, avg, streak: calculateCurrentStreak(entries) };
  }, [yearEntries, entries]);

  const completedGoals = goals.filter((g) => g.is_completed).length;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Error signing out:', error);
          }
        },
      },
    ]);
  };

  const handleAddGoal = async (title: string, description?: string) => {
    try {
      await createGoal({ year, title, description });
    } catch {
      Alert.alert('Could not add goal', 'Please try again.');
    }
  };

  const handleDeleteGoal = (id: string) => {
    Alert.alert('Delete goal', 'This removes the goal and its links to past entries.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  if (!user) return null;

  return (
    <Screen>
      <ScreenHeader title="You" eyebrow="Profile" />

      <View style={styles.identity}>
        <Avatar name={user.display_name} fallback={user.email} size={64} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{user.display_name || 'Anonymous'}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>

      <View style={styles.socialRow}>
        <SocialStat value={socialStats.followersCount} label="Followers" />
        <View style={styles.socialDivider} />
        <SocialStat value={socialStats.friendsCount || 0} label="Friends" />
        <View style={styles.socialDivider} />
        <SocialStat value={socialStats.followingCount} label="Following" />
      </View>

      <View style={styles.tiles}>
        <StatTile label="Check-ins" value={String(stats.total)} hint={`in ${year}`} />
        <StatTile
          label="Average mood"
          value={stats.avg > 0 ? stats.avg.toFixed(1) : '–'}
          hint={stats.avg > 0 ? MOODS[toMoodLevel(stats.avg)].label : 'No entries yet'}
          accent={stats.avg > 0 ? MOODS[toMoodLevel(stats.avg)].ink : undefined}
        />
        <StatTile label="Streak" value={`${stats.streak}d`} accent={stats.streak > 0 ? colors.brandStrong : undefined} />
      </View>

      <Pressable
        onPress={() => router.push(`/summary/${year}`)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.recapCard, pressed && { opacity: 0.92 }]}
      >
        <LinearGradient
          colors={['#FF8E48', '#F26A1B', '#B3430C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recapGradient}
        >
          <View style={styles.recapText}>
            <Text style={styles.recapEyebrow}>Year in review</Text>
            <Text style={styles.recapTitle}>Your {year} recap</Text>
            <Text style={styles.recapSub}>
              {stats.total > 0
                ? `${stats.total} check-ins so far. See how it’s shaping up.`
                : 'Starts filling in with your first check-in.'}
            </Text>
          </View>
          <View style={styles.recapFace}>
            <MoodFace mood={stats.avg > 0 ? toMoodLevel(stats.avg) : 4} size={56} />
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.inkOnBrand} style={styles.recapArrow} />
        </LinearGradient>
      </Pressable>

      <SectionHeader
        title={`${year} intentions`}
        action={{ label: '+ Add', onPress: () => setGoalModalVisible(true) }}
        style={styles.section}
      />
      {goals.length === 0 ? (
        <View style={styles.goalsEmpty}>
          <Text style={styles.goalsEmptyTitle}>Nothing set for {year} yet.</Text>
          <Text style={styles.goalsEmptyText}>
            Add one or two intentions. You can tag daily check-ins that move them forward.
          </Text>
        </View>
      ) : (
        <View style={styles.goals}>
          <Text style={styles.goalsProgress}>
            {completedGoals} of {goals.length} done
          </Text>
          {goals.map((goal) => (
            <GoalItem key={goal.id} goal={goal} onToggle={toggleCompletion} onDelete={handleDeleteGoal} />
          ))}
        </View>
      )}

      <SectionHeader title="Account" style={styles.section} />
      <ListGroup>
        <ListRow icon="mail-outline" title="Email" value={user.email} chevron={false} />
        <ListRow
          icon="calendar-outline"
          title="Member since"
          value={new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          chevron={false}
        />
        <ListRow icon="log-out-outline" iconTone="danger" title="Sign out" onPress={handleSignOut} chevron={false} destructive last />
      </ListGroup>

      <Text style={styles.version}>recap · v1.0</Text>

      <AddGoalModal
        visible={isGoalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onAdd={handleAddGoal}
      />
    </Screen>
  );
}

function SocialStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.socialStat}>
      <Text style={styles.socialValue}>{value}</Text>
      <Text style={styles.socialLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.title1,
  },
  email: {
    ...type.subhead,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.s12,
  },
  socialStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  socialValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
  },
  socialLabel: {
    ...type.caption,
  },
  socialDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recapCard: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...shadows.brand,
  },
  recapGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s20,
    gap: spacing.md,
  },
  recapText: {
    flex: 1,
    gap: spacing.xs,
  },
  recapEyebrow: {
    ...type.label,
    color: '#FFE8D6',
  },
  recapTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: colors.inkOnBrand,
  },
  recapSub: {
    ...type.footnote,
    color: '#FFE8D6',
  },
  recapFace: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapArrow: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    opacity: 0.8,
  },
  section: {
    marginTop: spacing.xl,
  },
  goals: {
    gap: spacing.sm,
  },
  goalsProgress: {
    ...type.caption,
    marginBottom: spacing.xs,
  },
  goalsEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.xs,
  },
  goalsEmptyTitle: {
    ...type.headline,
  },
  goalsEmptyText: {
    ...type.footnote,
  },
  version: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

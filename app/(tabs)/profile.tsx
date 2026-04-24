import { AddGoalModal, GoalItem } from '@/components/goals';
import { Button, Card } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore, useEntriesStore, useGoalsStore, useSocialStore } from '@/stores';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { entries, fetchEntriesByYear } = useEntriesStore();
  const { goals, fetchGoals, createGoal, toggleCompletion, deleteGoal } = useGoalsStore();
  const { stats: socialStats, fetchStats: fetchSocialStats } = useSocialStore();

  const [stats, setStats] = useState({
    totalEntries: 0,
    averageMood: 0,
  });

  const [isGoalModalVisible, setGoalModalVisible] = useState(false);

  useEffect(() => {
    if (entries.length > 0) {
      const moodSum = entries.reduce((sum, e) => sum + e.mood, 0);
      const avgMood = moodSum / entries.length;

      setStats({
        totalEntries: entries.length,
        averageMood: avgMood,
      });
    } else {
      setStats({
        totalEntries: 0,
        averageMood: 0,
      });
    }
  }, [entries]);

  useEffect(() => {
    if (user?.id) {
      const currentYear = new Date().getFullYear();
      fetchEntriesByYear(currentYear);
      fetchGoals(currentYear);
      fetchSocialStats(user.id);
    }
  }, [fetchEntriesByYear, fetchGoals, fetchSocialStats, user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddGoal = async (title: string, description?: string) => {
    try {
      await createGoal({
        year: new Date().getFullYear(),
        title,
        description,
      });
    } catch {
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleDeleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(id)
        }
      ]
    );
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user.display_name || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>

        <View style={styles.socialStats}>
          <TouchableOpacity style={styles.socialStat}>
            <Text style={styles.socialStatValue}>{socialStats.followersCount}</Text>
            <Text style={styles.socialStatLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.socialStatSeparator} />
          <TouchableOpacity style={styles.socialStat}>
            <Text style={styles.socialStatValue}>{socialStats.friendsCount || 0}</Text>
            <Text style={styles.socialStatLabel}>Friends</Text>
          </TouchableOpacity>
          <View style={styles.socialStatSeparator} />
          <TouchableOpacity style={styles.socialStat}>
            <Text style={styles.socialStatValue}>{socialStats.followingCount}</Text>
            <Text style={styles.socialStatLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard} padding="md">
          <Text style={styles.statValue}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </Card>
        <Card style={styles.statCard} padding="md">
          <Text style={styles.statValue}>
            {stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>Avg Mood</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{new Date().getFullYear()} Goals</Text>
        <TouchableOpacity onPress={() => setGoalModalVisible(true)}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalsList}>
        {goals.length === 0 ? (
          <Text style={styles.emptyText}>No goals set for this year yet.</Text>
        ) : (
          goals.map(goal => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onToggle={toggleCompletion}
              onDelete={handleDeleteGoal}
            />
          ))
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title="See Yearly Summary"
          variant="secondary"
          onPress={() => router.push(`/summary/${new Date().getFullYear()}`)}
          fullWidth
          style={{ marginBottom: spacing.md }}
        />
        <Button
          title="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
          fullWidth
          textStyle={{ color: colors.error }}
        />
      </View>

      <AddGoalModal
        visible={isGoalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onAdd={handleAddGoal}
      />
    </ScrollView>
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
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  socialStat: {
    alignItems: 'center',
  },
  socialStatValue: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  socialStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  socialStatSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.gray[200],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  addButton: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: typography.sizes.md,
  },
  goalsList: {
    marginBottom: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.muted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  actions: {
    marginTop: spacing.lg,
  },
});

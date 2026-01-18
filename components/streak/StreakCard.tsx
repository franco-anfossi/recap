import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StreakCardProps {
  streak: number;
  compact?: boolean;
}

export function StreakCard({ streak, compact = false }: StreakCardProps) {
  const isActive = streak > 0;

  const getMessage = () => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep it going!";
    if (streak < 7) return "You're building momentum!";
    if (streak < 30) return "Impressive dedication!";
    if (streak < 100) return "You're on fire!";
    return "Legendary streak!";
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactEmoji}>🔥</Text>
        <Text style={[
          styles.compactNumber,
          !isActive && styles.inactiveText
        ]}>
          {streak}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, !isActive && styles.containerInactive]}>
      <View style={styles.content}>
        <View style={styles.streakDisplay}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={[styles.streakNumber, !isActive && styles.inactiveText]}>
            {streak}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>Day Streak</Text>
          <Text style={styles.message}>{getMessage()}</Text>
        </View>
      </View>

      {isActive && (
        <View style={styles.progressBar}>
          {[...Array(7)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < Math.min(streak, 7) && styles.progressDotFilled,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  containerInactive: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  fireEmoji: {
    fontSize: 36,
  },
  streakNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary[600],
    marginLeft: spacing.xs,
  },
  inactiveText: {
    color: colors.gray[400],
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  progressBar: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[200],
  },
  progressDotFilled: {
    backgroundColor: colors.primary[500],
  },
  // Compact styles for header
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  compactEmoji: {
    fontSize: 16,
  },
  compactNumber: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    marginLeft: 4,
  },
});

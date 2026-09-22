import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StreakPillProps {
  streak: number;
}

/** Compact streak indicator for headers. */
export function StreakPill({ streak }: StreakPillProps) {
  const active = streak > 0;
  return (
    <View
      style={[styles.pill, !active && styles.pillInactive]}
      accessibilityLabel={`${streak} day streak`}
    >
      <Ionicons name="flame" size={16} color={active ? colors.brand : colors.inkMuted} />
      <Text style={[styles.pillNumber, !active && styles.pillNumberInactive]}>{streak}</Text>
    </View>
  );
}

interface StreakCardProps {
  streak: number;
  compact?: boolean;
}

export function StreakCard({ streak, compact = false }: StreakCardProps) {
  if (compact) return <StreakPill streak={streak} />;

  const isActive = streak > 0;
  const message = getMessage(streak);
  const weekProgress = Math.min(streak, 7);

  return (
    <View style={[styles.card, !isActive && styles.cardInactive]}>
      <View style={styles.cardRow}>
        <View style={[styles.flame, !isActive && styles.flameInactive]}>
          <Ionicons name="flame" size={22} color={isActive ? colors.inkOnBrand : colors.inkMuted} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>
            {streak} day{streak === 1 ? '' : 's'} in a row
          </Text>
          <Text style={styles.cardMessage}>{message}</Text>
        </View>
      </View>
      <View style={styles.track}>
        {[...Array(7)].map((_, i) => (
          <View key={i} style={[styles.segment, i < weekProgress && styles.segmentFilled]} />
        ))}
      </View>
    </View>
  );
}

function getMessage(streak: number) {
  if (streak === 0) return 'Log today to start a streak.';
  if (streak === 1) return 'Great start. Come back tomorrow.';
  if (streak < 7) return "You're building a habit.";
  if (streak < 30) return 'A full week and counting.';
  if (streak < 100) return "You're on fire.";
  return 'Legendary consistency.';
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandTint,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  pillInactive: {
    backgroundColor: colors.surfaceMuted,
  },
  pillNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.brandStrong,
  },
  pillNumberInactive: {
    color: colors.inkMuted,
  },
  card: {
    backgroundColor: colors.brandTint,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.md,
  },
  cardInactive: {
    backgroundColor: colors.surfaceMuted,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
  },
  flame: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameInactive: {
    backgroundColor: colors.surfaceSunken,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...type.title3,
  },
  cardMessage: {
    ...type.footnote,
  },
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(27, 23, 20, 0.08)',
  },
  segmentFilled: {
    backgroundColor: colors.brand,
  },
});

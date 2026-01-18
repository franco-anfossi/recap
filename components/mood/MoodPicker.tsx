import { MOODS, MoodLevel } from '@/constants/moods';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MoodPickerProps {
  selectedMood: MoodLevel | null;
  onSelect: (mood: MoodLevel) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function MoodPicker({ selectedMood, onSelect, size = 'lg' }: MoodPickerProps) {
  const handleSelect = async (mood: MoodLevel) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(mood);
  };

  const moodKeys = Object.keys(MOODS).map(Number) as MoodLevel[];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
      <View style={styles.moodRow}>
        {moodKeys.map((level) => {
          const mood = MOODS[level];
          const isSelected = selectedMood === level;

          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.moodButton,
                styles[`size_${size}`],
                isSelected && styles.selected,
                isSelected && { borderColor: mood.color },
              ]}
              onPress={() => handleSelect(level)}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, styles[`emoji_${size}`]]}>
                {mood.emoji}
              </Text>
              {size !== 'sm' && (
                <Text
                  style={[
                    styles.label,
                    isSelected && { color: mood.color },
                  ]}
                >
                  {mood.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface MoodIconProps {
  mood: MoodLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MoodIcon({ mood, size = 'md', showLabel = false }: MoodIconProps) {
  const moodInfo = MOODS[mood];

  const emojiSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={{ fontSize: emojiSizes[size] }}>{moodInfo.emoji}</Text>
      {showLabel && (
        <Text style={[styles.iconLabel, { color: moodInfo.color }]}>
          {moodInfo.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.sm,
  },
  size_sm: {
    width: 48,
    height: 48,
    padding: spacing.xs,
  },
  size_md: {
    width: 60,
    height: 72,
    padding: spacing.sm,
  },
  size_lg: {
    width: 64,
    height: 84,
    padding: spacing.sm,
  },
  selected: {
    borderWidth: 3,
    backgroundColor: colors.gray[50],
    transform: [{ scale: 1.05 }],
  },
  emoji: {
    textAlign: 'center',
  },
  emoji_sm: {
    fontSize: 24,
  },
  emoji_md: {
    fontSize: 28,
  },
  emoji_lg: {
    fontSize: 32,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});

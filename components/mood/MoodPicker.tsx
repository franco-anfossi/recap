import { MOODS, MOOD_LEVELS, MoodLevel } from '@/constants/moods';
import { colors, fonts, motion, spacing, type } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MoodFace } from './MoodFace';

interface MoodPickerProps {
  selectedMood: MoodLevel | null;
  onSelect: (mood: MoodLevel) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

const FACE_SIZES = { sm: 40, md: 48, lg: 56 } as const;

export function MoodPicker({ selectedMood, onSelect, size = 'lg', showLabels = true }: MoodPickerProps) {
  const handleSelect = (mood: MoodLevel) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect(mood);
  };

  return (
    <View style={styles.row}>
      {MOOD_LEVELS.map((level) => (
        <MoodOption
          key={level}
          level={level}
          faceSize={FACE_SIZES[size]}
          selected={selectedMood === level}
          dimmed={selectedMood !== null && selectedMood !== level}
          showLabel={showLabels}
          onPress={() => handleSelect(level)}
        />
      ))}
    </View>
  );
}

interface MoodOptionProps {
  level: MoodLevel;
  faceSize: number;
  selected: boolean;
  dimmed: boolean;
  showLabel: boolean;
  onPress: () => void;
}

function MoodOption({ level, faceSize, selected, dimmed, showLabel, onPress }: MoodOptionProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const info = MOODS[level];

  useEffect(() => {
    scale.value = withSpring(selected ? 1.18 : 1, { damping: 12, stiffness: 180 });
    opacity.value = withTiming(dimmed ? 0.45 : 1, { duration: motion.base });
  }, [selected, dimmed, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${info.label} mood`}
      accessibilityState={{ selected }}
      onPressIn={() => {
        scale.value = withSpring(selected ? 1.1 : 0.92, { damping: 14 });
      }}
      onPressOut={() => {
        scale.value = withSpring(selected ? 1.18 : 1, { damping: 12, stiffness: 180 });
      }}
      style={styles.option}
    >
      <Animated.View style={[styles.face, animatedStyle]}>
        <MoodFace mood={level} size={faceSize} />
      </Animated.View>
      {showLabel && (
        <Text
          style={[
            styles.label,
            selected && { color: info.ink, fontFamily: fonts.sansSemibold },
            dimmed && styles.labelDimmed,
          ]}
        >
          {info.label}
        </Text>
      )}
    </Pressable>
  );
}

interface MoodIconProps {
  mood: MoodLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function MoodIcon({ mood, size = 'md', showLabel = false }: MoodIconProps) {
  const moodInfo = MOODS[mood];
  const px = { sm: 20, md: 28, lg: 40 }[size];

  return (
    <View style={styles.iconContainer}>
      <MoodFace mood={mood} size={px} />
      {showLabel && (
        <Text style={[styles.iconLabel, { color: moodInfo.ink }]}>{moodInfo.label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  option: {
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...type.caption,
    color: colors.inkSecondary,
  },
  labelDimmed: {
    color: colors.inkMuted,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconLabel: {
    ...type.callout,
  },
});

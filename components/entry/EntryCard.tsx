import { MoodFace } from '@/components/mood';
import { MOODS, toMoodLevel } from '@/constants/moods';
import { colors, radius, spacing, type } from '@/constants/theme';
import { fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { Entry } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
  compact?: boolean;
}

export function EntryCard({ entry, onPress, compact = false }: EntryCardProps) {
  const level = toMoodLevel(entry.mood);
  const formattedDate = fmtCap(parseISO(entry.entry_date), t(compact ? 'today.dates.short' : 'today.dates.long'));

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
    >
      <MoodFace mood={level} size={compact ? 32 : 44} />
      <View style={styles.content}>
        <Text style={[styles.date, compact && styles.dateCompact]}>{formattedDate}</Text>
        <Text style={[styles.mood, { color: MOODS[level].ink }]}>{MOODS[level].label}</Text>
        {entry.note && !compact ? (
          <Text style={styles.note} numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardCompact: {
    padding: spacing.s12,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  date: {
    ...type.headline,
  },
  dateCompact: {
    ...type.callout,
  },
  mood: {
    ...type.caption,
  },
  note: {
    ...type.footnote,
    marginTop: spacing.xs,
  },
});

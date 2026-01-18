import { MoodIcon } from '@/components/mood';
import { Card } from '@/components/ui';
import { MoodLevel } from '@/constants/moods';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { Entry } from '@/types';
import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EntryCardProps {
  entry: Entry;
  onPress?: () => void;
  compact?: boolean;
}

export function EntryCard({ entry, onPress, compact = false }: EntryCardProps) {
  const formattedDate = format(new Date(entry.entry_date), compact ? 'MMM d' : 'EEEE, MMMM d');

  const Content = (
    <Card variant="elevated" padding={compact ? 'sm' : 'md'}>
      <View style={styles.row}>
        <MoodIcon mood={entry.mood as MoodLevel} size={compact ? 'md' : 'lg'} />
        <View style={styles.content}>
          <Text style={[styles.date, compact && styles.dateCompact]}>
            {formattedDate}
          </Text>
          {entry.note && !compact && (
            <Text style={styles.note} numberOfLines={2}>
              {entry.note}
            </Text>
          )}
        </View>
        {entry.video_url && (
          <View style={styles.videoIndicator}>
            <Text style={styles.videoIcon}>🎬</Text>
          </View>
        )}
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  date: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  dateCompact: {
    fontSize: typography.sizes.sm,
  },
  note: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  videoIndicator: {
    padding: spacing.xs,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.sm,
  },
  videoIcon: {
    fontSize: 16,
  },
});

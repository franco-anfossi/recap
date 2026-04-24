import { Button, Card } from '@/components/ui';
import { MOODS, toMoodLevel } from '@/constants/moods';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useEntriesStore } from '@/stores';
import { Entry } from '@/types';
import { format, isToday, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, deleteEntry, fetchEntryById } = useEntriesStore();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isFetchingEntry, setIsFetchingEntry] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadEntry = async () => {
      if (!id) {
        setEntry(null);
        setIsFetchingEntry(false);
        return;
      }

      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
        setIsFetchingEntry(false);
        return;
      }

      setIsFetchingEntry(true);
      const fetched = await fetchEntryById(id);

      if (isMounted) {
        setEntry(fetched);
        setIsFetchingEntry(false);
      }
    };

    loadEntry();

    return () => {
      isMounted = false;
    };
  }, [id, entries, fetchEntryById]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (entry) {
              await deleteEntry(entry.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (isFetchingEntry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading entry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Entry not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const moodInfo = MOODS[toMoodLevel(entry.mood)];
  const formattedDate = format(parseISO(entry.entry_date), 'EEEE, MMMM d, yyyy');

  const isEditable = isToday(parseISO(entry.entry_date));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {isEditable && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{formattedDate}</Text>

        <Card variant="elevated" padding="lg" style={styles.moodCard}>
          <View style={styles.moodHeader}>
            <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
            <View style={styles.moodInfo}>
              <Text style={[styles.moodLabel, { color: moodInfo.color }]}>
                {moodInfo.label}
              </Text>
              <Text style={styles.moodLevel}>Mood level: {entry.mood}/5</Text>
            </View>
          </View>
        </Card>

        {entry.note && (
          <Card variant="outlined" padding="lg" style={styles.noteCard}>
            <Text style={styles.noteTitle}>Note</Text>
            <Text style={styles.noteText}>{entry.note}</Text>
          </Card>
        )}

        {entry.video_url && (
          <Card variant="outlined" padding="lg" style={styles.videoCard}>
            <Text style={styles.noteTitle}>Video</Text>
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoIcon}>🎬</Text>
              <Text style={styles.videoText}>Video attached</Text>
              {entry.video_duration_seconds && (
                <Text style={styles.videoDuration}>
                  {entry.video_duration_seconds}s
                </Text>
              )}
            </View>
          </Card>
        )}

        <View style={styles.metadata}>
          <Text style={styles.metadataText}>
            Created: {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
          </Text>
          {entry.updated_at !== entry.created_at && (
            <Text style={styles.metadataText}>
              Updated: {format(new Date(entry.updated_at), 'MMM d, yyyy h:mm a')}
            </Text>
          )}
        </View>
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
    justifyContent: 'space-between',
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
  deleteButton: {
    padding: spacing.sm,
  },
  deleteText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
  content: {
    padding: spacing.lg,
  },
  date: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  moodCard: {
    marginBottom: spacing.lg,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  moodInfo: {
    flex: 1,
  },
  moodLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  moodLevel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  noteCard: {
    marginBottom: spacing.lg,
  },
  noteTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  noteText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  videoCard: {
    marginBottom: spacing.lg,
  },
  videoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  videoIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  videoText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  videoDuration: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  metadata: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  metadataText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

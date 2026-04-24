import { MoodPicker } from '@/components/mood';
import { Button, Card, TextArea } from '@/components/ui';
import { MoodLevel, toMoodLevel } from '@/constants/moods';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import * as api from '@/lib/api/goals';
import { useAuthStore, useEntriesStore, useGoalsStore } from '@/stores';
import { Visibility } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface EntryFormProps {
  date?: string; // ISO date string, defaults to today
  onSuccess?: () => void;
}

interface EntryDraft {
  mood: MoodLevel | null;
  note: string;
  visibility: Visibility;
  selectedGoalIds: string[];
  updatedAt: string;
}

function areGoalIdsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every(id => right.includes(id));
}

function isVisibility(value: unknown): value is Visibility {
  return value === 'private' || value === 'friends' || value === 'public';
}

export function EntryForm({ date, onSuccess }: EntryFormProps) {
  const entryDate = date || format(new Date(), 'yyyy-MM-dd');
  const entryYear = parseISO(entryDate).getFullYear();
  const draftStorageKey = `entry-draft:${entryDate}`;
  const { todayEntry, createOrUpdateEntry, isLoading, fetchTodayEntry, getEntryByDate } = useEntriesStore();
  const { user } = useAuthStore();
  const { goals, fetchGoals } = useGoalsStore();

  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'restored'>('idle');

  // Track initial state to detect changes
  const [initialGoalIds, setInitialGoalIds] = useState<string[]>([]);

  const isToday = entryDate === format(new Date(), 'yyyy-MM-dd');
  const existingEntry = isToday ? todayEntry : getEntryByDate(entryDate) || null;

  useEffect(() => {
    if (isToday) {
      fetchTodayEntry();
    }
    fetchGoals(entryYear);
  }, [entryYear, fetchGoals, fetchTodayEntry, isToday]);

  useEffect(() => {
    if (existingEntry) {
      setSelectedMood(toMoodLevel(existingEntry.mood));
      setNote(existingEntry.note || '');
      setVisibility(existingEntry.visibility || 'private');

      // Fetch linked goals for this entry
      api.getGoalsForEntry(existingEntry.id).then(ids => {
        setSelectedGoalIds(ids);
        setInitialGoalIds(ids);
      }).catch(err => console.error('Failed to fetch entry goals', err));
    } else {
      setSelectedMood(null);
      setNote('');
      setVisibility('private');
      setSelectedGoalIds([]);
      setInitialGoalIds([]);
    }
  }, [existingEntry]);

  useEffect(() => {
    let isMounted = true;

    setIsDraftLoaded(false);
    setDraftStatus('idle');

    AsyncStorage.getItem(draftStorageKey)
      .then((rawDraft) => {
        if (!isMounted || !rawDraft) return;

        const draft = JSON.parse(rawDraft) as Partial<EntryDraft>;

        if (typeof draft.mood === 'number') {
          setSelectedMood(toMoodLevel(draft.mood));
        }
        if (typeof draft.note === 'string') {
          setNote(draft.note);
        }
        if (isVisibility(draft.visibility)) {
          setVisibility(draft.visibility);
        }
        if (Array.isArray(draft.selectedGoalIds)) {
          setSelectedGoalIds(draft.selectedGoalIds.filter((id): id is string => typeof id === 'string'));
        }

        setDraftStatus('restored');
      })
      .catch((error) => {
        console.error('Failed to restore entry draft', error);
      })
      .finally(() => {
        if (isMounted) {
          setIsDraftLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [draftStorageKey, existingEntry?.id]);

  useEffect(() => {
    if (existingEntry) {
      const moodChanged = selectedMood !== existingEntry.mood;
      const noteChanged = note !== (existingEntry.note || '');
      const visibilityChanged = visibility !== (existingEntry.visibility || 'private');

      // Check if goals changed
      const goalsChanged = !areGoalIdsEqual(selectedGoalIds, initialGoalIds);

      setHasChanges(moodChanged || noteChanged || goalsChanged || visibilityChanged);
    } else {
      setHasChanges(selectedMood !== null);
    }
  }, [selectedMood, note, visibility, existingEntry, selectedGoalIds, initialGoalIds]);

  useEffect(() => {
    if (!isDraftLoaded) return;

    const existingEntryChanged = existingEntry
      ? selectedMood !== existingEntry.mood ||
        note !== (existingEntry.note || '') ||
        visibility !== (existingEntry.visibility || 'private') ||
        !areGoalIdsEqual(selectedGoalIds, initialGoalIds)
      : false;

    const newEntryHasContent =
      !existingEntry &&
      (selectedMood !== null ||
        note.trim().length > 0 ||
        visibility !== 'private' ||
        selectedGoalIds.length > 0);

    if (!existingEntryChanged && !newEntryHasContent) {
      AsyncStorage.removeItem(draftStorageKey).catch((error) => {
        console.error('Failed to clear entry draft', error);
      });
      setDraftStatus('idle');
      return;
    }

    const timeoutId = setTimeout(() => {
      const draft: EntryDraft = {
        mood: selectedMood,
        note,
        visibility,
        selectedGoalIds,
        updatedAt: new Date().toISOString(),
      };

      AsyncStorage.setItem(draftStorageKey, JSON.stringify(draft))
        .then(() => setDraftStatus('saved'))
        .catch((error) => {
          console.error('Failed to save entry draft', error);
        });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [
    draftStorageKey,
    existingEntry,
    initialGoalIds,
    isDraftLoaded,
    note,
    selectedGoalIds,
    selectedMood,
    visibility,
  ]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      }
      return [...prev, goalId];
    });
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('Select a mood', 'Please select how you\'re feeling today');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to save an entry');
      return;
    }

    try {
      const entry = await createOrUpdateEntry({
        user_id: user.id,
        entry_date: entryDate,
        mood: selectedMood,
        note: note.trim() || null,
        visibility,
      });

      // Update linked goals
      if (entry) {
        // Find added goals
        const addedGoals = selectedGoalIds.filter(id => !initialGoalIds.includes(id));
        // Find removed goals
        const removedGoals = initialGoalIds.filter(id => !selectedGoalIds.includes(id));

        await Promise.all([
          ...addedGoals.map(id => api.linkGoalToEntry(entry.id, id)),
          ...removedGoals.map(id => api.unlinkGoalFromEntry(entry.id, id))
        ]);

        // Update initial state
        setInitialGoalIds(selectedGoalIds);
      }

      await AsyncStorage.removeItem(draftStorageKey);
      setDraftStatus('idle');
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save entry');
    }
  };

  const formattedDate = format(parseISO(entryDate), 'EEEE, MMMM d');

  const pendingGoals = goals.filter(g => !g.is_completed);
  const visibilityOptions: { value: Visibility; label: string }[] = [
    { value: 'private', label: 'Private' },
    { value: 'friends', label: 'Friends' },
    { value: 'public', label: 'Public' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.date}>{formattedDate}</Text>

        <Card style={styles.moodCard} variant="elevated" padding="lg">
          <MoodPicker
            selectedMood={selectedMood}
            onSelect={setSelectedMood}
            size="lg"
          />
        </Card>

        {pendingGoals.length > 0 && (
          <Card style={styles.goalsCard} variant="outlined" padding="md">
            <Text style={styles.sectionTitle}>Working towards any goals today?</Text>
            <View style={styles.goalsContainer}>
              {pendingGoals.map(goal => {
                const isSelected = selectedGoalIds.includes(goal.id);
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalChip, isSelected && styles.goalChipSelected]}
                    onPress={() => toggleGoal(goal.id)}
                  >
                    <Text style={[styles.goalText, isSelected && styles.goalTextSelected]}>
                      {goal.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        <Card style={styles.noteCard} variant="outlined" padding="md">
          <TextArea
            label="Add a note (optional)"
            placeholder="What's on your mind today?"
            value={note}
            onChangeText={setNote}
            maxLength={500}
            containerStyle={{ marginBottom: 0 }}
          />

          <View style={styles.visibilityContainer}>
            <Text style={styles.visibilityLabel}>Visibility:</Text>
            <View style={styles.visibilityOptions}>
              {visibilityOptions.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.visibilityOption,
                    visibility === value && styles.visibilityOptionSelected
                  ]}
                  onPress={() => setVisibility(value)}
                >
                  <Text style={[
                    styles.visibilityText,
                    visibility === value && styles.visibilityTextSelected
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        <Button
          title={existingEntry ? 'Update Entry' : 'Save Entry'}
          onPress={handleSave}
          disabled={!hasChanges || !selectedMood}
          loading={isLoading}
          fullWidth
          size="lg"
        />

        {draftStatus !== 'idle' && (
          <Text style={styles.draftIndicator}>
            {draftStatus === 'restored' ? 'Draft restored' : 'Draft saved locally'}
          </Text>
        )}

        {existingEntry && (
          <Text style={styles.savedIndicator}>
            ✓ Entry saved at {format(new Date(existingEntry.updated_at), 'h:mm a')}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  date: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  moodCard: {
    marginBottom: spacing.lg,
  },
  goalsCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  goalChipSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[300],
  },
  goalText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  goalTextSelected: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  noteCard: {
    marginBottom: spacing.lg,
  },
  visibilityContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.md,
  },
  visibilityLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  visibilityOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  visibilityOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  visibilityText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  visibilityTextSelected: {
    color: colors.primary[700],
    fontWeight: '500',
  },
  savedIndicator: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  draftIndicator: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

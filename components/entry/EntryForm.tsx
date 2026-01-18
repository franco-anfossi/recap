import { MoodPicker } from '@/components/mood';
import { Button, Card, TextArea } from '@/components/ui';
import { MoodLevel } from '@/constants/moods';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import * as api from '@/lib/api/goals';
import { useAuthStore, useEntriesStore, useGoalsStore } from '@/stores';
import { Visibility } from '@/types';
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

export function EntryForm({ date, onSuccess }: EntryFormProps) {
  const entryDate = date || format(new Date(), 'yyyy-MM-dd');
  const { todayEntry, createOrUpdateEntry, isLoading, fetchTodayEntry } = useEntriesStore();
  const { user } = useAuthStore();
  const { goals, fetchGoals } = useGoalsStore();

  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Track initial state to detect changes
  const [initialGoalIds, setInitialGoalIds] = useState<string[]>([]);

  const isToday = entryDate === format(new Date(), 'yyyy-MM-dd');
  const existingEntry = isToday ? todayEntry : null;

  useEffect(() => {
    if (isToday) {
      fetchTodayEntry();
    }
    fetchGoals(new Date().getFullYear());
  }, [isToday]);

  useEffect(() => {
    if (existingEntry) {
      setSelectedMood(existingEntry.mood as MoodLevel);
      setNote(existingEntry.note || '');
      setVisibility(existingEntry.visibility || 'private');

      // Fetch linked goals for this entry
      api.getGoalsForEntry(existingEntry.id).then(ids => {
        setSelectedGoalIds(ids);
        setInitialGoalIds(ids);
      }).catch(err => console.error('Failed to fetch entry goals', err));
    }
  }, [existingEntry]);

  useEffect(() => {
    if (existingEntry) {
      const moodChanged = selectedMood !== existingEntry.mood;
      const noteChanged = note !== (existingEntry.note || '');
      const visibilityChanged = visibility !== (existingEntry.visibility || 'private');

      // Check if goals changed
      const goalsChanged =
        selectedGoalIds.length !== initialGoalIds.length ||
        !selectedGoalIds.every(id => initialGoalIds.includes(id));

      setHasChanges(moodChanged || noteChanged || goalsChanged || visibilityChanged);
    } else {
      setHasChanges(selectedMood !== null);
    }
  }, [selectedMood, note, visibility, existingEntry, selectedGoalIds, initialGoalIds]);

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
        note: note.trim() || undefined,
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

      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save entry');
    }
  };

  const formattedDate = format(parseISO(entryDate), 'EEEE, MMMM d');

  const pendingGoals = goals.filter(g => !g.is_completed);

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
              {(['private', 'friends'] as Visibility[]).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.visibilityOption,
                    visibility === v && styles.visibilityOptionSelected
                  ]}
                  onPress={() => setVisibility(v)}
                >
                  <Text style={[
                    styles.visibilityText,
                    visibility === v && styles.visibilityTextSelected
                  ]}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
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
});

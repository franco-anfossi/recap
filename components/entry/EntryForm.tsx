import { BurnerToggles } from '@/components/burners';
import { MoodPicker } from '@/components/mood';
import { Button, Chip, Segmented, TextArea } from '@/components/ui';
import { Burner, isBurner } from '@/constants/burners';
import { MOODS, MoodLevel, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import * as api from '@/lib/api/goals';
import { fmt } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { useAuthStore, useEntriesStore, useGoalsStore } from '@/stores';
import { Visibility } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, isToday as isTodayDate, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EntryFormProps {
  date?: string; // ISO date string, defaults to today
  onSuccess?: () => void;
  /** Rendered above the form inside the same scroll view (Today screen header). */
  header?: React.ReactNode;
  /** Rendered below the form only while no mood is selected (fills the empty state). */
  emptyFooter?: React.ReactNode;
}

interface EntryDraft {
  mood: MoodLevel | null;
  note: string;
  visibility: Visibility;
  selectedGoalIds: string[];
  burners?: Burner[];
  updatedAt: string;
}

function areGoalIdsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function areBurnersEqual(left: Burner[], right: Burner[]) {
  return left.length === right.length && left.every((b) => right.includes(b));
}

function isVisibility(value: unknown): value is Visibility {
  return value === 'private' || value === 'friends' || value === 'public';
}

const VISIBILITY_ICONS: { value: Visibility; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'private', icon: 'lock-closed' },
  { value: 'friends', icon: 'people' },
  { value: 'public', icon: 'globe-outline' },
];

function getVisibilityOptions(): { value: Visibility; label: string; icon: keyof typeof Ionicons.glyphMap }[] {
  return VISIBILITY_ICONS.map((option) => ({ ...option, label: t(`common.visibility.${option.value}`) }));
}

export function EntryForm({ date, onSuccess, header, emptyFooter }: EntryFormProps) {
  const insets = useSafeAreaInsets();
  const entryDate = date || format(new Date(), 'yyyy-MM-dd');
  const parsedDate = parseISO(entryDate);
  const entryYear = parsedDate.getFullYear();
  const draftStorageKey = `entry-draft:${entryDate}`;
  const { todayEntry, createOrUpdateEntry, isLoading, fetchTodayEntry, getEntryByDate } = useEntriesStore();
  const { user } = useAuthStore();
  const { goals, fetchGoals } = useGoalsStore();

  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [burners, setBurners] = useState<Burner[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saved' | 'restored'>('idle');
  const [justSaved, setJustSaved] = useState(false);
  const [initialGoalIds, setInitialGoalIds] = useState<string[]>([]);

  const isToday = isTodayDate(parsedDate);
  const existingEntry = isToday ? todayEntry : getEntryByDate(entryDate) || null;

  // Burners implied by the intentions tagged today; they can't be switched off individually.
  const impliedBurners = Array.from(
    new Set(goals.filter((g) => selectedGoalIds.includes(g.id) && g.burner).map((g) => g.burner as Burner))
  );
  const effectiveBurners = Array.from(new Set([...impliedBurners, ...burners]));

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
      setBurners((existingEntry.burners || []).filter(isBurner));

      api
        .getGoalsForEntry(existingEntry.id)
        .then((ids) => {
          setSelectedGoalIds(ids);
          setInitialGoalIds(ids);
        })
        .catch((err) => console.error('Failed to fetch entry goals', err));
    } else {
      setSelectedMood(null);
      setNote('');
      setVisibility('private');
      setSelectedGoalIds([]);
      setBurners([]);
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

        if (typeof draft.mood === 'number') setSelectedMood(toMoodLevel(draft.mood));
        if (typeof draft.note === 'string') setNote(draft.note);
        if (isVisibility(draft.visibility)) setVisibility(draft.visibility);
        if (Array.isArray(draft.selectedGoalIds)) {
          setSelectedGoalIds(draft.selectedGoalIds.filter((id): id is string => typeof id === 'string'));
        }
        if (Array.isArray(draft.burners)) setBurners(draft.burners.filter(isBurner));

        setDraftStatus('restored');
      })
      .catch((error) => {
        console.error('Failed to restore entry draft', error);
      })
      .finally(() => {
        if (isMounted) setIsDraftLoaded(true);
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
      const goalsChanged = !areGoalIdsEqual(selectedGoalIds, initialGoalIds);
      const burnersChanged = !areBurnersEqual(effectiveBurners, (existingEntry.burners || []).filter(isBurner));
      setHasChanges(moodChanged || noteChanged || goalsChanged || visibilityChanged || burnersChanged);
    } else {
      setHasChanges(selectedMood !== null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMood, note, visibility, existingEntry, selectedGoalIds, initialGoalIds, burners]);

  useEffect(() => {
    if (!isDraftLoaded) return;

    const existingEntryChanged = existingEntry
      ? selectedMood !== existingEntry.mood ||
        note !== (existingEntry.note || '') ||
        visibility !== (existingEntry.visibility || 'private') ||
        !areGoalIdsEqual(selectedGoalIds, initialGoalIds) ||
        !areBurnersEqual(effectiveBurners, (existingEntry.burners || []).filter(isBurner))
      : false;

    const newEntryHasContent =
      !existingEntry &&
      (selectedMood !== null ||
        note.trim().length > 0 ||
        visibility !== 'private' ||
        selectedGoalIds.length > 0 ||
        burners.length > 0);

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
        burners,
        updatedAt: new Date().toISOString(),
      };

      AsyncStorage.setItem(draftStorageKey, JSON.stringify(draft))
        .then(() => setDraftStatus('saved'))
        .catch((error) => {
          console.error('Failed to save entry draft', error);
        });
    }, 350);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorageKey, existingEntry, initialGoalIds, isDraftLoaded, note, selectedGoalIds, selectedMood, visibility, burners]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert(t('today.form.pickMoodTitle'), t('today.form.pickMoodMessage'));
      return;
    }
    if (!user?.id) {
      Alert.alert(t('today.form.notSignedInTitle'), t('today.form.notSignedInMessage'));
      return;
    }

    try {
      const entry = await createOrUpdateEntry({
        user_id: user.id,
        entry_date: entryDate,
        mood: selectedMood,
        note: note.trim() || null,
        visibility,
        burners: effectiveBurners,
      });

      if (entry) {
        const addedGoals = selectedGoalIds.filter((id) => !initialGoalIds.includes(id));
        const removedGoals = initialGoalIds.filter((id) => !selectedGoalIds.includes(id));

        await Promise.all([
          ...addedGoals.map((id) => api.linkGoalToEntry(entry.id, id)),
          ...removedGoals.map((id) => api.unlinkGoalFromEntry(entry.id, id)),
        ]);

        setInitialGoalIds(selectedGoalIds);
      }

      await AsyncStorage.removeItem(draftStorageKey);
      setDraftStatus('idle');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      onSuccess?.();
    } catch (error: any) {
      Alert.alert(t('common.errors.couldNotSave'), error.message || t('common.actions.tryAgain'));
    }
  };

  const pendingGoals = goals.filter((g) => !g.is_completed);
  const moodInfo = selectedMood ? MOODS[selectedMood] : null;
  const question = isToday
    ? t('today.form.howWasYourDay')
    : t('today.form.howWasDay', { day: fmt(parsedDate, t('today.dates.shortWithWeekday')) });
  const notePlaceholder = moodInfo
    ? t('today.form.notePlaceholderMood', { word: moodInfo.word })
    : t('today.form.notePlaceholder');

  const statusText = justSaved
    ? t('today.form.saved')
    : existingEntry && !hasChanges
      ? t('today.form.loggedAt', { time: fmt(new Date(existingEntry.updated_at), t('today.dates.time')) })
      : draftStatus === 'restored'
        ? t('today.form.draftRestored')
        : draftStatus === 'saved'
          ? t('today.form.draftSaved')
          : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {header}

        <Animated.View layout={LinearTransition.duration(250)} style={styles.moodCard}>
          <View style={styles.moodCardHeader}>
            <Text style={styles.question}>{question}</Text>
            {moodInfo && (
              <Animated.View entering={FadeIn.duration(200)} style={[styles.moodTag, { backgroundColor: moodInfo.tint }]}>
                <Text style={[styles.moodTagText, { color: moodInfo.ink }]}>{moodInfo.label}</Text>
              </Animated.View>
            )}
          </View>
          <MoodPicker selectedMood={selectedMood} onSelect={setSelectedMood} size="lg" />
        </Animated.View>

        {selectedMood && (
          <Animated.View entering={FadeInDown.duration(300)} layout={LinearTransition.duration(250)} style={styles.details}>
            <View style={styles.noteCard}>
              <TextArea
                placeholder={notePlaceholder}
                value={note}
                onChangeText={setNote}
                maxLength={500}
                bare
                style={styles.noteInput}
              />
            </View>

            {pendingGoals.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockLabel}>{t('today.form.movedForwardOn')}</Text>
                <View style={styles.chips}>
                  {pendingGoals.map((goal) => (
                    <Chip
                      key={goal.id}
                      label={goal.title}
                      selected={selectedGoalIds.includes(goal.id)}
                      onPress={() => toggleGoal(goal.id)}
                      icon={selectedGoalIds.includes(goal.id) ? 'checkmark' : undefined}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.block}>
              <Text style={styles.blockLabel}>{t('today.form.energyQuestion')}</Text>
              <BurnerToggles value={burners} onChange={setBurners} implied={impliedBurners} />
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>{t('today.form.whoCanSee')}</Text>
              <Segmented options={getVisibilityOptions()} value={visibility} onChange={setVisibility} />
            </View>
          </Animated.View>
        )}

        <Animated.View layout={LinearTransition.duration(250)} style={styles.actions}>
          <Button
            title={existingEntry ? t('today.form.updateEntry') : isToday ? t('today.form.saveToday') : t('today.form.saveEntry')}
            onPress={handleSave}
            disabled={!hasChanges || !selectedMood}
            loading={isLoading}
            fullWidth
            size="lg"
            icon={justSaved ? 'checkmark' : undefined}
          />
          {statusText && (
            <View style={styles.status}>
              {justSaved && <Ionicons name="checkmark-circle" size={14} color={colors.success} />}
              <Text style={[styles.statusText, justSaved && { color: colors.success }]}>{statusText}</Text>
            </View>
          )}
        </Animated.View>

        {!selectedMood && emptyFooter && (
          <Animated.View entering={FadeIn.duration(250)} layout={LinearTransition.duration(250)}>
            {emptyFooter}
          </Animated.View>
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
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  moodCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingTop: spacing.s20,
    paddingBottom: spacing.s12,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  question: {
    ...type.title2,
    flex: 1,
  },
  moodTag: {
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
  },
  moodTagText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
  },
  details: {
    gap: spacing.md,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.s12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteInput: {
    fontFamily: fonts.displayItalic,
    fontSize: 18,
    lineHeight: 27,
    minHeight: 96,
  },
  block: {
    gap: spacing.sm,
  },
  blockLabel: {
    ...type.label,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.s12,
    marginTop: spacing.xs,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statusText: {
    ...type.footnote,
    color: colors.inkMuted,
  },
});

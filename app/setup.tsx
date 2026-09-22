import { MoodFace, MoodPicker } from '@/components/mood';
import { Button, Input, TextArea, Wordmark } from '@/components/ui';
import { MOODS, MoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { useAuthStore, useEntriesStore, useGoalsStore, useOnboardingStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS = ['name', 'mood', 'intention', 'done'] as const;
type Step = (typeof STEPS)[number];

const SUGGESTED_INTENTIONS = [
  'Move my body most days',
  'Read more, scroll less',
  'Call a friend every week',
  'Sleep before midnight',
];

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuthStore();
  const { createOrUpdateEntry } = useEntriesStore();
  const { createGoal } = useGoalsStore();
  const completeSetup = useOnboardingStore((s) => s.completeSetup);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(user?.display_name ?? '');
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [note, setNote] = useState('');
  const [intention, setIntention] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: Step = STEPS[stepIndex];
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((stepIndex + 1) / STEPS.length, { duration: 350 });
  }, [stepIndex, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const advance = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const back = () => {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const finish = () => {
    if (user) completeSetup(user.id);
  };

  // --- step handlers -------------------------------------------------------

  const submitName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Add a name so your recap feels like yours.');
      return;
    }
    if (trimmed === (user?.display_name ?? '')) {
      advance();
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ display_name: trimmed });
      advance();
    } catch (err: any) {
      setError(err?.message || 'Could not save your name.');
    } finally {
      setSaving(false);
    }
  };

  const submitMood = async () => {
    if (!mood || !user) return;
    setSaving(true);
    try {
      await createOrUpdateEntry({
        user_id: user.id,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        mood,
        note: note.trim() || null,
        visibility: 'private',
      });
      advance();
    } catch (err: any) {
      setError(err?.message || 'Could not save your first check-in.');
    } finally {
      setSaving(false);
    }
  };

  const submitIntention = async () => {
    const trimmed = intention.trim();
    if (!trimmed) {
      advance();
      return;
    }
    setSaving(true);
    try {
      await createGoal({ year: new Date().getFullYear(), title: trimmed });
      advance();
    } catch (err: any) {
      setError(err?.message || 'Could not save your intention.');
    } finally {
      setSaving(false);
    }
  };

  const firstName = (name.trim() || user?.display_name || '').split(' ')[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.topRow}>
          {stepIndex > 0 && step !== 'done' ? (
            <Pressable onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={{ width: 22 }} />
          )}
          <Wordmark size={22} />
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'name' && (
          <Animated.View key="name" entering={FadeInDown.duration(350)} exiting={FadeOut.duration(150)} style={styles.step}>
            <Text style={styles.eyebrow}>Step 1 of 3</Text>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.body}>This is how you’ll show up to friends who follow your recaps.</Text>
            <Input
              placeholder="Your name"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError(null);
              }}
              autoCapitalize="words"
              autoFocus
              returnKeyType="next"
              onSubmitEditing={submitName}
              containerStyle={styles.field}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button title="Continue" onPress={submitName} loading={saving} size="lg" fullWidth />
          </Animated.View>
        )}

        {step === 'mood' && (
          <Animated.View key="mood" entering={FadeInDown.duration(350)} exiting={FadeOut.duration(150)} style={styles.step}>
            <Text style={styles.eyebrow}>Step 2 of 3 · Your first check-in</Text>
            <Text style={styles.title}>
              How’s today going{firstName ? `, ${firstName}` : ''}?
            </Text>
            <Text style={styles.body}>No wrong answers. This becomes day one of your recap.</Text>
            <View style={styles.pickerCard}>
              <MoodPicker selectedMood={mood} onSelect={setMood} size="lg" />
            </View>
            {mood && (
              <Animated.View entering={FadeIn.duration(250)}>
                <TextArea
                  placeholder={`What made it ${MOODS[mood].word}?`}
                  value={note}
                  onChangeText={setNote}
                  maxLength={280}
                  style={{ minHeight: 88 }}
                />
              </Animated.View>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              title="Save my first check-in"
              onPress={submitMood}
              disabled={!mood}
              loading={saving}
              size="lg"
              fullWidth
            />
          </Animated.View>
        )}

        {step === 'intention' && (
          <Animated.View key="intention" entering={FadeInDown.duration(350)} exiting={FadeOut.duration(150)} style={styles.step}>
            <Text style={styles.eyebrow}>Step 3 of 3 · Optional</Text>
            <Text style={styles.title}>One intention for {new Date().getFullYear()}.</Text>
            <Text style={styles.body}>
              You’ll be able to tag check-ins that moved it forward. Keep it small and real.
            </Text>
            <Input
              placeholder="e.g. Run twice a week"
              value={intention}
              onChangeText={setIntention}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={submitIntention}
              containerStyle={styles.field}
            />
            <View style={styles.suggestions}>
              {SUGGESTED_INTENTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setIntention(s)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.suggestion,
                    intention === s && styles.suggestionActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.suggestionText, intention === s && styles.suggestionTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={intention.trim() ? 'Set intention' : 'Skip for now'}
              onPress={submitIntention}
              loading={saving}
              variant={intention.trim() ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
            />
          </Animated.View>
        )}

        {step === 'done' && (
          <Animated.View key="done" entering={FadeInDown.duration(400)} style={[styles.step, styles.doneStep]}>
            <View style={styles.doneHero}>
              <View style={styles.doneFace}>
                <MoodFace mood={mood ?? 4} size={96} />
              </View>
              <View style={styles.doneBadge}>
                <Ionicons name="flame" size={14} color={colors.inkOnBrand} />
                <Text style={styles.doneBadgeText}>Day 1</Text>
              </View>
            </View>
            <Text style={[styles.title, styles.center]}>You’re all set{firstName ? `, ${firstName}` : ''}.</Text>
            <Text style={[styles.body, styles.center]}>
              Your first check-in is saved. Come back tomorrow and the streak begins.
            </Text>
            <View style={styles.tips}>
              <Tip icon="today-outline" text="Log once a day. Backdate from the calendar if you miss one." />
              <Tip icon="lock-closed-outline" text="Entries are private unless you choose to share them." />
              <Tip icon="sparkles-outline" text="Your yearly recap builds itself as you go." />
            </View>
            <Button title="Open recap" onPress={finish} size="lg" fullWidth icon="arrow-forward" iconPosition="right" />
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.tip}>
      <View style={styles.tipIcon}>
        <Ionicons name={icon} size={16} color={colors.brand} />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: radius.full,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
  },
  step: {
    gap: spacing.md,
  },
  eyebrow: {
    ...type.label,
    color: colors.brand,
  },
  title: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 38,
  },
  body: {
    ...type.body,
    color: colors.inkSecondary,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  field: {
    marginBottom: spacing.xs,
  },
  error: {
    ...type.footnote,
    color: colors.danger,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestion: {
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionActive: {
    backgroundColor: colors.brandTint,
    borderColor: colors.brand,
  },
  suggestionText: {
    ...type.callout,
    fontSize: 14,
    color: colors.inkSecondary,
  },
  suggestionTextActive: {
    color: colors.brandDeep,
  },
  doneStep: {
    alignItems: 'stretch',
    justifyContent: 'center',
    flex: 1,
  },
  doneHero: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  doneFace: {
    width: 140,
    height: 140,
    borderRadius: radius.full,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    marginTop: -spacing.md,
  },
  doneBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.inkOnBrand,
  },
  tips: {
    gap: spacing.s12,
    marginVertical: spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.s12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    ...type.subhead,
    flex: 1,
    color: colors.ink,
  },
});

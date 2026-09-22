import { BurnerPicker } from '@/components/burners';
import { MoodFace, MoodPicker } from '@/components/mood';
import { Button, Input, TextArea, Wordmark } from '@/components/ui';
import { Burner, BURNERS } from '@/constants/burners';
import { MOODS, MoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
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

const STEPS = ['name', 'mood', 'intention', 'focus', 'done'] as const;
type Step = (typeof STEPS)[number];

const SUGGESTED_INTENTIONS: { title: string; burner: Burner }[] = [
  { title: t('auth.setup.steps.intention.suggestions.move'), burner: 'health' },
  { title: t('auth.setup.steps.intention.suggestions.read'), burner: 'health' },
  { title: t('auth.setup.steps.intention.suggestions.call'), burner: 'friends' },
  { title: t('auth.setup.steps.intention.suggestions.dinner'), burner: 'family' },
  { title: t('auth.setup.steps.intention.suggestions.leave'), burner: 'work' },
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
  const [intentionBurner, setIntentionBurner] = useState<Burner | null>(null);
  const [dimmed, setDimmed] = useState<Burner | null>(null);
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
      setError(t('auth.setup.steps.name.errors.empty'));
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
      setError(err?.message || t('auth.setup.steps.name.errors.saveFailed'));
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
      setError(err?.message || t('auth.setup.steps.mood.errors.saveFailed'));
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
    if (!intentionBurner) {
      setError(t('auth.setup.steps.intention.errors.noBurner'));
      return;
    }
    setSaving(true);
    try {
      await createGoal({ year: new Date().getFullYear(), title: trimmed, burner: intentionBurner });
      advance();
    } catch (err: any) {
      setError(err?.message || t('auth.setup.steps.intention.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const submitFocus = async () => {
    if (!dimmed) {
      advance();
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ dimmed_burner: dimmed });
      advance();
    } catch (err: any) {
      setError(err?.message || t('auth.setup.steps.focus.errors.saveFailed'));
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
            <Pressable onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.actions.back')}>
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
            <Text style={styles.eyebrow}>{t('auth.setup.steps.name.eyebrow')}</Text>
            <Text style={styles.title}>{t('auth.setup.steps.name.title')}</Text>
            <Text style={styles.body}>{t('auth.setup.steps.name.body')}</Text>
            <Input
              placeholder={t('auth.setup.steps.name.placeholder')}
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
            <Button title={t('common.actions.continue')} onPress={submitName} loading={saving} size="lg" fullWidth />
          </Animated.View>
        )}

        {step === 'mood' && (
          <Animated.View key="mood" entering={FadeInDown.duration(350)} exiting={FadeOut.duration(150)} style={styles.step}>
            <Text style={styles.eyebrow}>{t('auth.setup.steps.mood.eyebrow')}</Text>
            <Text style={styles.title}>
              {firstName ? t('auth.setup.steps.mood.titleNamed', { name: firstName }) : t('auth.setup.steps.mood.title')}
            </Text>
            <Text style={styles.body}>{t('auth.setup.steps.mood.body')}</Text>
            <View style={styles.pickerCard}>
              <MoodPicker selectedMood={mood} onSelect={setMood} size="lg" />
            </View>
            {mood && (
              <Animated.View entering={FadeIn.duration(250)}>
                <TextArea
                  placeholder={t('auth.setup.steps.mood.notePlaceholder', { word: MOODS[mood].word })}
                  value={note}
                  onChangeText={setNote}
                  maxLength={280}
                  style={{ minHeight: 88 }}
                />
              </Animated.View>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={t('auth.setup.steps.mood.submit')}
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
            <Text style={styles.eyebrow}>{t('auth.setup.steps.intention.eyebrow')}</Text>
            <Text style={styles.title}>{t('auth.setup.steps.intention.title', { year: new Date().getFullYear() })}</Text>
            <Text style={styles.body}>{t('auth.setup.steps.intention.body')}</Text>
            <Input
              placeholder={t('auth.setup.steps.intention.placeholder')}
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
                  key={s.title}
                  onPress={() => {
                    setIntention(s.title);
                    setIntentionBurner(s.burner);
                    setError(null);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.suggestion,
                    intention === s.title && styles.suggestionActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.suggestionText, intention === s.title && styles.suggestionTextActive]}>{s.title}</Text>
                </Pressable>
              ))}
            </View>
            {intention.trim().length > 0 && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.burnerBlock}>
                <Text style={styles.blockLabel}>{t('auth.setup.steps.intention.burnerLabel')}</Text>
                <BurnerPicker
                  value={intentionBurner}
                  onChange={(b) => {
                    setIntentionBurner(b);
                    setError(null);
                  }}
                />
              </Animated.View>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={intention.trim() ? t('auth.setup.steps.intention.submit') : t('auth.setup.steps.intention.skip')}
              onPress={submitIntention}
              loading={saving}
              variant={intention.trim() ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
            />
          </Animated.View>
        )}

        {step === 'focus' && (
          <Animated.View key="focus" entering={FadeInDown.duration(350)} exiting={FadeOut.duration(150)} style={styles.step}>
            <Text style={styles.eyebrow}>{t('auth.setup.steps.focus.eyebrow')}</Text>
            <Text style={styles.title}>{t('auth.setup.steps.focus.title')}</Text>
            <Text style={styles.body}>{t('auth.setup.steps.focus.body')}</Text>
            <BurnerPicker value={dimmed} onChange={setDimmed} allowNone />
            <Text style={styles.hint}>
              {dimmed
                ? t('auth.setup.steps.focus.hintDimmed', { burner: BURNERS[dimmed].label })
                : t('auth.setup.steps.focus.hintNone')}
            </Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={dimmed ? t('auth.setup.steps.focus.submitDimmed', { burner: BURNERS[dimmed].label }) : t('auth.setup.steps.focus.submitNone')}
              onPress={submitFocus}
              loading={saving}
              variant={dimmed ? 'primary' : 'secondary'}
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
                <Text style={styles.doneBadgeText}>{t('auth.setup.steps.done.badge')}</Text>
              </View>
            </View>
            <Text style={[styles.title, styles.center]}>{firstName ? t('auth.setup.steps.done.titleNamed', { name: firstName }) : t('auth.setup.steps.done.title')}</Text>
            <Text style={[styles.body, styles.center]}>{t('auth.setup.steps.done.body')}</Text>
            <View style={styles.tips}>
              <Tip icon="today-outline" text={t('auth.setup.steps.done.tips.daily')} />
              <Tip icon="flame-outline" text={t('auth.setup.steps.done.tips.burners')} />
              <Tip icon="lock-closed-outline" text={t('auth.setup.steps.done.tips.private')} />
              <Tip icon="sparkles-outline" text={t('auth.setup.steps.done.tips.recap')} />
            </View>
            <Button title={t('auth.setup.steps.done.submit')} onPress={finish} size="lg" fullWidth icon="arrow-forward" iconPosition="right" />
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
  hint: {
    ...type.footnote,
    color: colors.inkMuted,
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
  burnerBlock: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  blockLabel: {
    ...type.label,
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

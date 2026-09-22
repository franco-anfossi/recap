import { BurnerPicker, BurnerTag } from '@/components/burners';
import { Button, Input, TextArea } from '@/components/ui';
import { Burner } from '@/constants/burners';
import { colors, radius, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { GoalProgress, YearlyGoal } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GoalItemProps {
  goal: YearlyGoal;
  progress?: GoalProgress;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onPress?: () => void;
  /** Hide the burner tag (e.g. when the item is already listed under its burner). */
  showBurner?: boolean;
}

export function describeProgress(progress?: GoalProgress): string {
  if (!progress || progress.days === 0) return t('profile.goal.notMoved');
  const parts = [t('profile.goal.daysMoved', { count: progress.days })];
  if (progress.thisWeek > 0) parts.push(t('profile.goal.thisWeek', { count: progress.thisWeek }));
  else if (progress.lastDate) {
    const ago = differenceInCalendarDays(new Date(), parseISO(progress.lastDate));
    parts.push(
      ago === 0
        ? t('profile.goal.lastToday')
        : ago === 1
          ? t('profile.goal.lastYesterday')
          : t('profile.goal.lastDaysAgo', { count: ago })
    );
  }
  return parts.join(' · ');
}

export function GoalItem({ goal, progress, onToggle, onDelete, onPress, showBurner = true }: GoalItemProps) {
  const toggle = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.notificationAsync(
        goal.is_completed ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
      );
    }
    onToggle(goal.id, !goal.is_completed);
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.goal, goal.is_completed && styles.goalDone, pressed && onPress && styles.pressed]}
    >
      <Pressable
        onPress={toggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: goal.is_completed }}
        accessibilityLabel={goal.title}
        style={[styles.checkbox, goal.is_completed && styles.checkboxDone]}
      >
        {goal.is_completed && <Ionicons name="checkmark" size={16} color={colors.inkOnBrand} />}
      </Pressable>

      <View style={styles.goalText}>
        <Text style={[styles.goalTitle, goal.is_completed && styles.goalTitleDone]}>{goal.title}</Text>
        <View style={styles.goalMeta}>
          {showBurner && goal.burner && <BurnerTag burner={goal.burner} />}
          <Text style={styles.goalProgress} numberOfLines={1}>
            {goal.is_completed ? t('profile.goal.done') : describeProgress(progress)}
          </Text>
        </View>
        {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}
      </View>

      <Pressable
        onPress={() => onDelete(goal.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('profile.goal.deleteLabel', { title: goal.title })}
        style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="close" size={18} color={colors.inkMuted} />
      </Pressable>
    </Pressable>
  );
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (input: { title: string; description?: string; burner: Burner }) => void;
  /** Preselect a burner (e.g. when adding from a burner section). */
  initialBurner?: Burner | null;
}

export function AddGoalModal({ visible, onClose, onAdd, initialBurner = null }: AddGoalModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [burner, setBurner] = useState<Burner | null>(initialBurner);

  const reset = () => {
    setTitle('');
    setDescription('');
    setBurner(initialBurner);
  };

  const handleAdd = () => {
    if (!title.trim() || !burner) return;
    onAdd({ title: title.trim(), description: description.trim() || undefined, burner });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel={t('common.actions.close')} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.grabber} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{t('profile.goal.sheet.title')}</Text>
            <Text style={styles.sheetSub}>{t('profile.goal.sheet.subtitle')}</Text>

            <Input
              placeholder={t('profile.goal.sheet.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              autoFocus
              autoCapitalize="sentences"
              returnKeyType="next"
            />

            <View style={styles.block}>
              <Text style={styles.blockLabel}>{t('profile.goal.sheet.burnerQuestion')}</Text>
              <BurnerPicker value={burner} onChange={setBurner} />
            </View>

            <TextArea
              placeholder={t('profile.goal.sheet.descriptionPlaceholder')}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
              style={{ minHeight: 64 }}
            />

            <View style={styles.actions}>
              <Button title={t('common.actions.cancel')} variant="secondary" onPress={handleClose} style={styles.action} />
              <Button title={t('common.actions.add')} onPress={handleAdd} disabled={!title.trim() || !burner} style={styles.action} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalDone: {
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  goalText: {
    flex: 1,
    gap: spacing.xs,
  },
  goalTitle: {
    ...type.bodyMedium,
  },
  goalTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.inkMuted,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalProgress: {
    ...type.caption,
    flex: 1,
  },
  goalDescription: {
    ...type.footnote,
  },
  delete: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderCurve: 'continuous',
    paddingTop: spacing.s12,
    paddingHorizontal: spacing.screen,
    maxHeight: '88%',
  },
  sheetContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.s12,
  },
  sheetTitle: {
    ...type.title1,
  },
  sheetSub: {
    ...type.subhead,
    marginTop: -spacing.sm,
  },
  block: {
    gap: spacing.sm,
  },
  blockLabel: {
    ...type.label,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  action: {
    flex: 1,
  },
});

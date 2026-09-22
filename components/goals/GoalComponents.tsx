import { Button, Input, TextArea } from '@/components/ui';
import { colors, radius, spacing, type } from '@/constants/theme';
import { YearlyGoal } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GoalItemProps {
  goal: YearlyGoal;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}

export function GoalItem({ goal, onToggle, onDelete }: GoalItemProps) {
  const toggle = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.notificationAsync(
        goal.is_completed ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
      );
    }
    onToggle(goal.id, !goal.is_completed);
  };

  return (
    <View style={[styles.goal, goal.is_completed && styles.goalDone]}>
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
        {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}
      </View>

      <Pressable
        onPress={() => onDelete(goal.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${goal.title}`}
        style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="close" size={18} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string) => void;
}

export function AddGoalModal({ visible, onClose, onAdd }: AddGoalModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim() || undefined);
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
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>New intention</Text>
          <Text style={styles.sheetSub}>Something for this year. Keep it small enough to actually do.</Text>

          <Input
            placeholder="e.g. Run twice a week"
            value={title}
            onChangeText={setTitle}
            autoFocus
            autoCapitalize="sentences"
            returnKeyType="next"
          />
          <TextArea
            placeholder="Why it matters (optional)"
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            style={{ minHeight: 72 }}
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={handleClose} style={styles.action} />
            <Button title="Add" onPress={handleAdd} disabled={!title.trim()} style={styles.action} />
          </View>
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
    gap: 2,
  },
  goalTitle: {
    ...type.bodyMedium,
  },
  goalTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.inkMuted,
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
    padding: spacing.screen,
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    ...type.title1,
  },
  sheetSub: {
    ...type.subhead,
    marginTop: -spacing.sm,
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

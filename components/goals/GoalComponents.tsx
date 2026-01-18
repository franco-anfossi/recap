import { Button } from '@/components/ui';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { YearlyGoal } from '@/types';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface GoalItemProps {
  goal: YearlyGoal;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}

export function GoalItem({ goal, onToggle, onDelete }: GoalItemProps) {
  return (
    <View style={styles.goalContainer}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => onToggle(goal.id, !goal.is_completed)}
      >
        <View style={[styles.checkbox, goal.is_completed && styles.checked]}>
          {goal.is_completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, goal.is_completed && styles.completedText]}>
          {goal.title}
        </Text>
        {goal.description && (
          <Text style={styles.description}>{goal.description}</Text>
        )}
      </View>

      <TouchableOpacity onPress={() => onDelete(goal.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string) => void;
}

export function AddGoalModal({ visible, onClose, onAdd }: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title, description);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Yearly Goal</Text>

          <TextInput
            style={styles.input}
            placeholder="What's your goal?"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Add Goal" onPress={handleAdd} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Goal Item
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  checkboxContainer: {
    padding: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteText: {
    fontSize: 20,
    color: colors.gray[400],
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});

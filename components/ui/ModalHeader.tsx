import { colors, radius, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalHeaderProps {
  title?: string;
  onClose?: () => void;
  right?: React.ReactNode;
  /** Use a back chevron instead of a close cross. */
  back?: boolean;
}

export function ModalHeader({ title, onClose, right, back = false }: ModalHeaderProps) {
  const insets = useSafeAreaInsets();
  // Modals on iOS already sit below the status bar; full-screen pushes don't.
  const top = Platform.OS === 'ios' ? spacing.sm : insets.top + spacing.sm;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <View style={styles.grabber} />
      <View style={styles.row}>
        <IconButton
          name={back ? 'chevron-back' : 'close'}
          onPress={onClose ?? (() => router.back())}
          label={back ? t('common.actions.back') : t('common.actions.close')}
        />
        {title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.spacer} />
        )}
        <View style={styles.right}>{right ?? <View style={styles.rightPlaceholder} />}</View>
      </View>
    </View>
  );
}

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  tone?: 'default' | 'brand' | 'danger';
  size?: number;
}

export function IconButton({ name, onPress, label, tone = 'default', size = 20 }: IconButtonProps) {
  const color =
    tone === 'brand' ? colors.brandStrong : tone === 'danger' ? colors.danger : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.s12,
    opacity: Platform.OS === 'ios' ? 1 : 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...type.headline,
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  rightPlaceholder: {
    width: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});

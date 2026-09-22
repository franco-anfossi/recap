import { colors, radius, shadows, spacing, type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: string }> = {
  primary: { container: { backgroundColor: colors.brand }, text: colors.inkOnBrand },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
    text: colors.ink,
  },
  soft: { container: { backgroundColor: colors.brandTint }, text: colors.brandStrong },
  ghost: { container: { backgroundColor: 'transparent' }, text: colors.brandStrong },
  danger: { container: { backgroundColor: colors.dangerSoft }, text: colors.danger },
};

const sizeStyles: Record<Size, { container: ViewStyle; fontSize: number; icon: number }> = {
  sm: { container: { minHeight: 38, paddingHorizontal: spacing.md }, fontSize: 14, icon: 16 },
  md: { container: { minHeight: 48, paddingHorizontal: spacing.lg }, fontSize: 16, icon: 18 },
  lg: { container: { minHeight: 56, paddingHorizontal: spacing.xl }, fontSize: 17, icon: 20 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isInactive = disabled || loading;

  const iconNode = icon ? (
    <Ionicons name={icon} size={s.icon} color={v.text} />
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        v.container,
        s.container,
        variant === 'primary' && !isInactive && shadows.brand,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.row}>
          {iconPosition === 'left' && iconNode}
          <Text style={[type.button, { color: v.text, fontSize: s.fontSize }, textStyle]}>
            {title}
          </Text>
          {iconPosition === 'right' && iconNode}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderCurve: 'continuous',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});

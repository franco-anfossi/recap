import { colors, radius, shadows, spacing } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined' | 'muted' | 'tinted';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`padding_${padding}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  default: {
    ...shadows.sm,
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
  tinted: {
    backgroundColor: colors.brandTint,
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: spacing.s12,
  },
  padding_md: {
    padding: spacing.md,
  },
  padding_lg: {
    padding: spacing.s20,
  },
});

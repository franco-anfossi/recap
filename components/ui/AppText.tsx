import { colors, type, TypeVariant } from '@/constants/theme';
import React from 'react';
import { Text, TextProps } from 'react-native';

type InkColor = 'ink' | 'secondary' | 'muted' | 'brand' | 'onBrand' | 'danger' | 'success';

const inkColors: Record<InkColor, string> = {
  ink: colors.ink,
  secondary: colors.inkSecondary,
  muted: colors.inkMuted,
  brand: colors.brand,
  onBrand: colors.inkOnBrand,
  danger: colors.danger,
  success: colors.success,
};

interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: InkColor;
  align?: 'left' | 'center' | 'right';
}

export function AppText({
  variant = 'body',
  color,
  align,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        type[variant],
        color && { color: inkColors[color] },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    />
  );
}

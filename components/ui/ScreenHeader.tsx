import { colors, spacing, type } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Large editorial header used at the top of every tab screen. */
export function ScreenHeader({ title, eyebrow, subtitle, right, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textBlock}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...type.label,
    color: colors.brand,
  },
  title: {
    ...type.display,
  },
  subtitle: {
    ...type.subhead,
  },
  right: {
    paddingBottom: spacing.xs,
  },
});

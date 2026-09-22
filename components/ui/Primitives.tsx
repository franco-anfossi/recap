import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Button } from './Button';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

interface AvatarProps {
  name?: string | null;
  fallback?: string;
  size?: number;
  tone?: 'brand' | 'muted';
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ name, fallback, size = 44, tone = 'brand', style }: AvatarProps) {
  const initial = (name?.trim()?.[0] || fallback?.trim()?.[0] || '?').toUpperCase();
  const bg = tone === 'brand' ? colors.brandSoft : colors.surfaceSunken;
  const fg = tone === 'brand' ? colors.brandDeep : colors.inkSecondary;

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { color: fg, fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chip (selectable pill)
// ---------------------------------------------------------------------------

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected = false, onPress, icon, style }: ChipProps) {
  const handlePress = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={selected ? colors.brandDeep : colors.inkSecondary} />
      )}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Segmented control
// ---------------------------------------------------------------------------

interface SegmentedProps<T extends string> {
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function Segmented<T extends string>({ options, value, onChange, style }: SegmentedProps<T>) {
  return (
    <View style={[styles.segmented, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
              onChange(option.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={14}
                color={active ? colors.ink : colors.inkMuted}
              />
            )}
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatTile({ label, value, hint, accent, style }: StatTileProps) {
  return (
    <View style={[styles.statTile, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent ? { color: accent } : null]} numberOfLines={1}>
        {value}
      </Text>
      {hint && (
        <Text style={styles.statHint} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, message, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.brand} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {action && (
        <Button title={action.label} onPress={action.onPress} variant="soft" size="sm" style={styles.emptyAction} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// List row (grouped list item)
// ---------------------------------------------------------------------------

interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'default' | 'brand' | 'danger';
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  last?: boolean;
  destructive?: boolean;
}

export function ListRow({
  icon,
  iconTone = 'default',
  title,
  subtitle,
  value,
  onPress,
  chevron = !!onPress,
  last = false,
  destructive = false,
}: ListRowProps) {
  const iconColor =
    iconTone === 'brand' ? colors.brand : iconTone === 'danger' ? colors.danger : colors.inkSecondary;
  const iconBg =
    iconTone === 'brand' ? colors.brandTint : iconTone === 'danger' ? colors.dangerSoft : colors.surfaceMuted;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.listRow, !last && styles.listRowDivider, pressed && styles.listRowPressed]}
    >
      {icon && (
        <View style={[styles.listIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
      )}
      <View style={styles.listText}>
        <Text style={[styles.listTitle, destructive && { color: colors.danger }]}>{title}</Text>
        {subtitle && <Text style={styles.listSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.listValue}>{value}</Text>}
      {chevron && <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />}
    </Pressable>
  );
}

export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.listGroup, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Pill badge
// ---------------------------------------------------------------------------

interface PillProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: 'brand' | 'muted' | 'success';
  style?: StyleProp<ViewStyle>;
}

export function Pill({ label, icon, tone = 'brand', style }: PillProps) {
  const bg = tone === 'brand' ? colors.brandTint : tone === 'success' ? colors.successSoft : colors.surfaceMuted;
  const fg = tone === 'brand' ? colors.brandStrong : tone === 'success' ? colors.success : colors.inkSecondary;
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {icon && <Ionicons name={icon} size={13} color={fg} />}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.displayBold,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.brandTint,
    borderColor: colors.brand,
  },
  chipText: {
    ...type.callout,
    fontSize: 14,
    color: colors.inkSecondary,
  },
  chipTextSelected: {
    color: colors.brandDeep,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.full,
    padding: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    boxShadow: '0 1px 3px rgba(27, 23, 20, 0.08)',
  },
  segmentText: {
    ...type.callout,
    fontSize: 14,
    color: colors.inkMuted,
  },
  segmentTextActive: {
    color: colors.ink,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.s12,
  },
  sectionTitle: {
    ...type.title2,
  },
  sectionAction: {
    ...type.callout,
    color: colors.brandStrong,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    ...type.caption,
  },
  statValue: {
    ...type.stat,
  },
  statHint: {
    ...type.footnote,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...type.title2,
    textAlign: 'center',
  },
  emptyMessage: {
    ...type.subhead,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: spacing.sm,
  },
  listGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s12,
    minHeight: 56,
  },
  listRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listText: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    ...type.bodyMedium,
  },
  listSubtitle: {
    ...type.footnote,
  },
  listValue: {
    ...type.subhead,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  pillText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});

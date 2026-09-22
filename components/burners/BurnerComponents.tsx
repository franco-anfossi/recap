import { Burner, BURNER_KEYS, BURNERS } from '@/constants/burners';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

function tick() {
  if (process.env.EXPO_OS === 'ios') Haptics.selectionAsync();
}

// ---------------------------------------------------------------------------
// BurnerTag — small pill with icon + label, used on cards and lists
// ---------------------------------------------------------------------------

interface BurnerTagProps {
  burner: Burner;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function BurnerTag({ burner, size = 'sm', style }: BurnerTagProps) {
  const info = BURNERS[burner];
  const iconSize = size === 'sm' ? 12 : 14;
  return (
    <View style={[styles.tag, size === 'md' && styles.tagMd, { backgroundColor: info.tint }, style]}>
      <Ionicons name={info.icon} size={iconSize} color={info.ink} />
      <Text style={[styles.tagText, size === 'md' && styles.tagTextMd, { color: info.ink }]}>{info.label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BurnerPicker — single select (which burner does this intention feed?)
// ---------------------------------------------------------------------------

interface BurnerPickerProps {
  value: Burner | null;
  onChange: (burner: Burner | null) => void;
  /** Allow tapping the selected burner again to clear it. */
  allowNone?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BurnerPicker({ value, onChange, allowNone = false, style }: BurnerPickerProps) {
  return (
    <View style={[styles.grid, style]}>
      {BURNER_KEYS.map((key) => {
        const info = BURNERS[key];
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              tick();
              onChange(active && allowNone ? null : key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={info.label}
            style={({ pressed }) => [
              styles.cell,
              active && { backgroundColor: info.tint, borderColor: info.color },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.cellIcon, { backgroundColor: active ? info.color : colors.surfaceMuted }]}>
              <Ionicons name={active ? info.icon : info.iconOutline} size={18} color={active ? colors.inkOnBrand : colors.inkSecondary} />
            </View>
            <Text style={[styles.cellLabel, active && { color: info.ink, fontFamily: fonts.sansSemibold }]}>{info.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BurnerToggles — multi select row for the daily check-in
// ---------------------------------------------------------------------------

interface BurnerTogglesProps {
  value: Burner[];
  onChange: (burners: Burner[]) => void;
  /** Burners implied by tagged intentions; shown as locked-on. */
  implied?: Burner[];
  style?: StyleProp<ViewStyle>;
}

export function BurnerToggles({ value, onChange, implied = [], style }: BurnerTogglesProps) {
  const toggle = (key: Burner) => {
    if (implied.includes(key)) return;
    tick();
    onChange(value.includes(key) ? value.filter((b) => b !== key) : [...value, key]);
  };

  return (
    <View style={[styles.row, style]}>
      {BURNER_KEYS.map((key) => {
        const info = BURNERS[key];
        const active = value.includes(key) || implied.includes(key);
        const locked = implied.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => toggle(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled: locked }}
            accessibilityLabel={locked ? `${info.label}, ${t('common.burners.fromIntention')}` : info.label}
            style={({ pressed }) => [
              styles.toggle,
              active && { backgroundColor: info.tint, borderColor: info.color },
              pressed && !locked && styles.pressed,
            ]}
          >
            <Ionicons name={active ? info.icon : info.iconOutline} size={16} color={active ? info.ink : colors.inkMuted} />
            <Text style={[styles.toggleText, active && { color: info.ink, fontFamily: fonts.sansSemibold }]}>{info.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BurnerBalance — four bars showing where energy went over a period
// ---------------------------------------------------------------------------

interface BurnerBalanceProps {
  /** Days each burner received energy. */
  counts: Record<Burner, number>;
  /** Days in the period, used to scale the bars. */
  totalDays: number;
  dimmed?: Burner | null;
  style?: StyleProp<ViewStyle>;
}

export function BurnerBalance({ counts, totalDays, dimmed, style }: BurnerBalanceProps) {
  const max = Math.max(1, ...BURNER_KEYS.map((k) => counts[k] || 0));
  return (
    <View style={[styles.balance, style]}>
      {BURNER_KEYS.map((key) => {
        const info = BURNERS[key];
        const count = counts[key] || 0;
        const pct = Math.round((count / max) * 100);
        const isDimmed = dimmed === key;
        return (
          <View key={key} style={styles.balanceRow}>
            <View style={[styles.balanceIcon, { backgroundColor: info.tint }]}>
              <Ionicons name={info.icon} size={14} color={info.ink} />
            </View>
            <View style={styles.balanceText}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>{info.label}</Text>
                {isDimmed && <Text style={styles.balanceDimmed}>{t('common.burners.turnedDown')}</Text>}
                <Text style={styles.balanceValue}>
                  {count}
                  <Text style={styles.balanceTotal}> / {t('common.burners.daysShort', { count: totalDays })}</Text>
                </Text>
              </View>
              <View style={styles.balanceTrack}>
                <View
                  style={[
                    styles.balanceFill,
                    { width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, backgroundColor: info.color },
                    isDimmed && { opacity: 0.45 },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagMd: {
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.xs + 1,
  },
  tagText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 11,
    lineHeight: 14,
  },
  tagTextMd: {
    fontSize: 13,
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.s12,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cellIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    ...type.callout,
    color: colors.inkSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  toggleText: {
    ...type.caption,
    color: colors.inkMuted,
  },
  balance: {
    gap: spacing.s12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
  },
  balanceIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceText: {
    flex: 1,
    gap: spacing.xs + 1,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  balanceLabel: {
    ...type.callout,
    fontSize: 14,
    flex: 1,
  },
  balanceDimmed: {
    ...type.caption,
    color: colors.inkMuted,
  },
  balanceValue: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.ink,
  },
  balanceTotal: {
    fontFamily: fonts.sans,
    color: colors.inkMuted,
  },
  balanceTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  balanceFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});

import { BurnerPicker, BurnerTag } from '@/components/burners';
import { AddGoalModal, GoalItem } from '@/components/goals';
import { MoodFace } from '@/components/mood';
import {
  Avatar,
  Button,
  ListGroup,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { Burner, BURNER_KEYS, BURNERS } from '@/constants/burners';
import { MOODS, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, shadows, spacing, type } from '@/constants/theme';
import { fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
import {
  DEFAULT_REMINDER,
  formatReminderTime,
  loadReminderSettings,
  ReminderSettings,
  saveReminderSettings,
} from '@/lib/notifications';
import { calculateCurrentStreak } from '@/lib/streak';
import { useAuthStore, useEntriesStore, useGoalsStore, useSocialStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut, updateProfile, deleteAccount } = useAuthStore();
  const { entries, fetchEntriesByYear } = useEntriesStore();
  const { goals, progress, fetchGoals, createGoal, toggleCompletion, deleteGoal } = useGoalsStore();
  const { stats: socialStats, fetchStats: fetchSocialStats } = useSocialStore();
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [goalModalBurner, setGoalModalBurner] = useState<Burner | null>(null);
  const [isFocusVisible, setFocusVisible] = useState(false);
  const [isReminderVisible, setReminderVisible] = useState(false);
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);

  const year = new Date().getFullYear();

  useEffect(() => {
    if (user?.id) {
      fetchEntriesByYear(year);
      fetchGoals(year);
      fetchSocialStats(user.id);
    }
  }, [fetchEntriesByYear, fetchGoals, fetchSocialStats, user?.id, year]);

  useEffect(() => {
    loadReminderSettings().then(setReminder);
  }, []);

  const yearEntries = useMemo(() => entries.filter((e) => e.entry_date.startsWith(String(year))), [entries, year]);

  const stats = useMemo(() => {
    const total = yearEntries.length;
    const avg = total > 0 ? yearEntries.reduce((s, e) => s + e.mood, 0) / total : 0;
    return { total, avg, streak: calculateCurrentStreak(entries) };
  }, [yearEntries, entries]);

  const goalsByBurner = useMemo(() => {
    const groups = BURNER_KEYS.map((key) => ({ key, goals: goals.filter((g) => g.burner === key) }));
    const unassigned = goals.filter((g) => !g.burner);
    return { groups: groups.filter((g) => g.goals.length > 0), unassigned };
  }, [goals]);

  const completedGoals = goals.filter((g) => g.is_completed).length;
  const dimmed = user?.dimmed_burner ?? null;

  const handleSignOut = () => {
    Alert.alert(t('profile.account.signOutAlert.title'), t('profile.account.signOutAlert.message'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      {
        text: t('profile.account.signOutAlert.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Error signing out:', error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.account.deleteAlert.title'),
      t('profile.account.deleteAlert.message'),
      [
        { text: t('common.actions.cancel'), style: 'cancel' },
        {
          text: t('profile.account.deleteAlert.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (error: any) {
              Alert.alert(t('profile.account.deleteAlert.error'), error?.message || t('common.actions.tryAgain'));
            }
          },
        },
      ]
    );
  };

  const openGoalModal = (burner: Burner | null = null) => {
    setGoalModalBurner(burner);
    setGoalModalVisible(true);
  };

  const handleAddGoal = async (input: { title: string; description?: string; burner: Burner }) => {
    try {
      await createGoal({ year, ...input });
    } catch {
      Alert.alert(t('profile.intentions.addError'), t('common.actions.tryAgain'));
    }
  };

  const handleDeleteGoal = (id: string) => {
    Alert.alert(t('profile.intentions.deleteAlert.title'), t('profile.intentions.deleteAlert.message'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      { text: t('common.actions.delete'), style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  const handleDim = async (burner: Burner | null) => {
    setFocusVisible(false);
    try {
      await updateProfile({ dimmed_burner: burner });
    } catch (error: any) {
      Alert.alert(t('common.errors.couldNotSave'), error?.message || t('common.actions.tryAgain'));
    }
  };

  const handleReminderChange = async (next: ReminderSettings) => {
    setReminder(next);
    const ok = await saveReminderSettings(next);
    if (!ok && next.enabled) {
      setReminder({ ...next, enabled: false });
      Alert.alert(
        t('profile.reminder.permission.title'),
        Platform.OS === 'web' ? t('profile.reminder.permission.web') : t('profile.reminder.permission.native')
      );
    }
  };

  if (!user) return null;

  return (
    <Screen>
      <ScreenHeader title={t('profile.header.title')} eyebrow={t('profile.header.eyebrow')} />

      <View style={styles.identity}>
        <Avatar name={user.display_name} fallback={user.email} size={64} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{user.display_name || t('profile.identity.anonymous')}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>

      <View style={styles.socialRow}>
        <SocialStat value={socialStats.followersCount} label={t('profile.social.followers')} />
        <View style={styles.socialDivider} />
        <SocialStat value={socialStats.friendsCount || 0} label={t('profile.social.friends')} />
        <View style={styles.socialDivider} />
        <SocialStat value={socialStats.followingCount} label={t('profile.social.following')} />
      </View>

      <View style={styles.tiles}>
        <StatTile label={t('profile.stats.checkIns.label')} value={String(stats.total)} hint={t('profile.stats.checkIns.hint', { year })} />
        <StatTile
          label={t('profile.stats.avgMood.label')}
          value={stats.avg > 0 ? stats.avg.toFixed(1) : '–'}
          hint={stats.avg > 0 ? MOODS[toMoodLevel(stats.avg)].label : t('profile.stats.avgMood.empty')}
          accent={stats.avg > 0 ? MOODS[toMoodLevel(stats.avg)].ink : undefined}
        />
        <StatTile label={t('profile.stats.streak.label')} value={t('profile.stats.streak.value', { count: stats.streak })} hint={t('profile.stats.streak.hint')} accent={stats.streak > 0 ? colors.brandStrong : undefined} />
      </View>

      {/* Focus: the deliberate trade-off */}
      <Pressable
        onPress={() => setFocusVisible(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.focus, pressed && { opacity: 0.9 }]}
      >
        <View style={[styles.focusIcon, dimmed && { backgroundColor: BURNERS[dimmed].tint }]}>
          <Ionicons name={dimmed ? BURNERS[dimmed].icon : 'flame-outline'} size={18} color={dimmed ? BURNERS[dimmed].ink : colors.brand} />
        </View>
        <View style={styles.focusText}>
          <Text style={styles.focusTitle}>
            {dimmed ? t('profile.focus.titleDimmed', { burner: BURNERS[dimmed].label }) : t('profile.focus.titleOn')}
          </Text>
          <Text style={styles.focusSub}>
            {dimmed ? t('profile.focus.subDimmed') : t('profile.focus.subOn')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
      </Pressable>

      <Pressable
        onPress={() => router.push(`/summary/${year}`)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.recapCard, pressed && { opacity: 0.92 }]}
      >
        <LinearGradient
          colors={['#FF8E48', '#F26A1B', '#B3430C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recapGradient}
        >
          <View style={styles.recapText}>
            <Text style={styles.recapEyebrow}>{t('profile.recap.eyebrow')}</Text>
            <Text style={styles.recapTitle}>{t('profile.recap.title', { year })}</Text>
            <Text style={styles.recapSub}>
              {stats.total > 0 ? t('profile.recap.subtitle', { count: stats.total }) : t('profile.recap.empty')}
            </Text>
          </View>
          <View style={styles.recapFace}>
            <MoodFace mood={stats.avg > 0 ? toMoodLevel(stats.avg) : 4} size={56} />
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.inkOnBrand} style={styles.recapArrow} />
        </LinearGradient>
      </Pressable>

      <SectionHeader
        title={t('profile.intentions.title', { year })}
        action={{ label: t('profile.intentions.add'), onPress: () => openGoalModal() }}
        style={styles.section}
      />
      {goals.length === 0 ? (
        <View style={styles.goalsEmpty}>
          <Text style={styles.goalsEmptyTitle}>{t('profile.intentions.emptyTitle', { year })}</Text>
          <Text style={styles.goalsEmptyText}>{t('profile.intentions.emptyText')}</Text>
          <Button title={t('profile.intentions.addFirst')} variant="soft" size="sm" onPress={() => openGoalModal()} style={styles.goalsEmptyAction} />
        </View>
      ) : (
        <View style={styles.goals}>
          <Text style={styles.goalsProgress}>
            {t('profile.intentions.progress', { done: completedGoals, total: goals.length })}
          </Text>
          {goalsByBurner.groups.map((group) => (
            <View key={group.key} style={styles.burnerGroup}>
              <View style={styles.burnerGroupHeader}>
                <BurnerTag burner={group.key} size="md" />
                {dimmed === group.key && <Text style={styles.burnerGroupDimmed}>{t('common.burners.turnedDown')}</Text>}
              </View>
              {group.goals.map((goal) => (
                <GoalItem key={goal.id} goal={goal} progress={progress[goal.id]} onToggle={toggleCompletion} onDelete={handleDeleteGoal} showBurner={false} />
              ))}
            </View>
          ))}
          {goalsByBurner.unassigned.length > 0 && (
            <View style={styles.burnerGroup}>
              <Text style={styles.burnerGroupLabel}>{t('profile.intentions.noBurner')}</Text>
              {goalsByBurner.unassigned.map((goal) => (
                <GoalItem key={goal.id} goal={goal} progress={progress[goal.id]} onToggle={toggleCompletion} onDelete={handleDeleteGoal} />
              ))}
            </View>
          )}
        </View>
      )}

      <SectionHeader title={t('profile.reminder.title')} style={styles.section} />
      <ListGroup>
        <ListRow
          icon="notifications-outline"
          iconTone={reminder.enabled ? 'brand' : 'default'}
          title={t('profile.reminder.rowTitle')}
          subtitle={
            reminder.enabled
              ? t('profile.reminder.everyDayAt', { time: formatReminderTime(reminder.hour, reminder.minute) })
              : t('profile.reminder.off')
          }
          onPress={reminder.enabled ? () => setReminderVisible(true) : undefined}
          chevron={reminder.enabled}
          last
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('profile.reminder.switchLabel')}</Text>
          <Switch
            value={reminder.enabled}
            onValueChange={(enabled) => handleReminderChange({ ...reminder, enabled })}
            trackColor={{ true: colors.brand, false: colors.surfaceSunken }}
            thumbColor={colors.surface}
          />
        </View>
      </ListGroup>

      <SectionHeader title={t('profile.account.title')} style={styles.section} />
      <ListGroup>
        <ListRow icon="mail-outline" title={t('profile.account.email')} value={user.email} chevron={false} />
        <ListRow
          icon="calendar-outline"
          title={t('profile.account.memberSince')}
          value={fmtCap(new Date(user.created_at), 'MMM yyyy')}
          chevron={false}
        />
        <ListRow icon="shield-checkmark-outline" title={t('profile.account.privacy')} onPress={() => router.push('/legal/privacy')} />
        <ListRow icon="document-text-outline" title={t('profile.account.terms')} onPress={() => router.push('/legal/terms')} />
        <ListRow icon="log-out-outline" title={t('profile.account.signOut')} onPress={handleSignOut} chevron={false} />
        <ListRow icon="trash-outline" iconTone="danger" title={t('profile.account.deleteAccount')} onPress={handleDeleteAccount} chevron={false} destructive last />
      </ListGroup>

      <Text style={styles.version}>{t('profile.version')}</Text>

      <AddGoalModal
        visible={isGoalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        onAdd={handleAddGoal}
        initialBurner={goalModalBurner}
      />

      <FocusSheet visible={isFocusVisible} value={dimmed} onClose={() => setFocusVisible(false)} onSelect={handleDim} />

      <ReminderSheet
        visible={isReminderVisible}
        value={reminder}
        onClose={() => setReminderVisible(false)}
        onChange={(next) => {
          setReminderVisible(false);
          handleReminderChange(next);
        }}
      />
    </Screen>
  );
}

function SocialStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.socialStat}>
      <Text style={styles.socialValue}>{value}</Text>
      <Text style={styles.socialLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Focus sheet — pick the burner you are turning down
// ---------------------------------------------------------------------------

function FocusSheet({
  visible,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  value: Burner | null;
  onClose: () => void;
  onSelect: (burner: Burner | null) => void;
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Burner | null>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.actions.close')} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>{t('profile.focus.sheet.title')}</Text>
          <Text style={styles.sheetSub}>{t('profile.focus.sheet.subtitle')}</Text>
          <BurnerPicker value={draft} onChange={setDraft} allowNone />
          <View style={styles.sheetActions}>
            <Button title={t('profile.focus.sheet.allOn')} variant="secondary" onPress={() => onSelect(null)} style={styles.sheetAction} />
            <Button title={t('common.actions.save')} onPress={() => onSelect(draft)} disabled={draft === value} style={styles.sheetAction} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Reminder sheet — pick a time
// ---------------------------------------------------------------------------

const HOURS = [7, 8, 9, 12, 18, 19, 20, 21, 22];

function ReminderSheet({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: ReminderSettings;
  onClose: () => void;
  onChange: (next: ReminderSettings) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.actions.close')} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>{t('profile.reminder.sheet.title')}</Text>
          <Text style={styles.sheetSub}>{t('profile.reminder.sheet.subtitle')}</Text>
          <View style={styles.timeGrid}>
            {HOURS.map((hour) => {
              const active = value.hour === hour;
              return (
                <Pressable
                  key={hour}
                  onPress={() => onChange({ ...value, hour, minute: 0, enabled: true })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                >
                  <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{formatReminderTime(hour, 0)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.title1,
  },
  email: {
    ...type.subhead,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.s12,
  },
  socialStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  socialValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
  },
  socialLabel: {
    ...type.caption,
  },
  socialDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  focus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  focusIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusText: {
    flex: 1,
    gap: 2,
  },
  focusTitle: {
    ...type.headline,
  },
  focusSub: {
    ...type.footnote,
  },
  recapCard: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    ...shadows.brand,
  },
  recapGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s20,
    gap: spacing.md,
  },
  recapText: {
    flex: 1,
    gap: spacing.xs,
  },
  recapEyebrow: {
    ...type.label,
    color: '#FFE8D6',
  },
  recapTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: colors.inkOnBrand,
  },
  recapSub: {
    ...type.footnote,
    color: '#FFE8D6',
  },
  recapFace: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapArrow: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    opacity: 0.8,
  },
  section: {
    marginTop: spacing.xl,
  },
  goals: {
    gap: spacing.md,
  },
  goalsProgress: {
    ...type.caption,
    marginBottom: -spacing.sm,
  },
  burnerGroup: {
    gap: spacing.sm,
  },
  burnerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  burnerGroupDimmed: {
    ...type.caption,
  },
  burnerGroupLabel: {
    ...type.label,
  },
  goalsEmpty: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  goalsEmptyTitle: {
    ...type.headline,
  },
  goalsEmptyText: {
    ...type.footnote,
  },
  goalsEmptyAction: {
    marginTop: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  switchLabel: {
    ...type.bodyMedium,
  },
  version: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
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
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sheetAction: {
    flex: 1,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipActive: {
    backgroundColor: colors.brandTint,
    borderColor: colors.brand,
  },
  timeChipText: {
    ...type.callout,
    fontSize: 14,
    color: colors.inkSecondary,
  },
  timeChipTextActive: {
    color: colors.brandDeep,
  },
});

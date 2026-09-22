import { BurnerTag } from '@/components/burners';
import { MoodFace } from '@/components/mood';
import { Button, Chip, IconButton, ModalHeader, Pill } from '@/components/ui';
import { isBurner } from '@/constants/burners';
import { MOODS, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import * as goalsApi from '@/lib/api/goals';
import { fmt, fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { useEntriesStore, useGoalsStore } from '@/stores';
import { Entry, Visibility } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VISIBILITY: Record<Visibility, { labelKey: string; icon: keyof typeof Ionicons.glyphMap }> = {
  private: { labelKey: 'common.visibility.onlyYou', icon: 'lock-closed' },
  friends: { labelKey: 'common.visibility.friends', icon: 'people' },
  public: { labelKey: 'common.visibility.public', icon: 'globe-outline' },
};

export default function EntryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, deleteEntry, fetchEntryById } = useEntriesStore();
  const { goals, fetchGoals } = useGoalsStore();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isFetchingEntry, setIsFetchingEntry] = useState(true);
  const [linkedGoalIds, setLinkedGoalIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadEntry = async () => {
      if (!id) {
        setEntry(null);
        setIsFetchingEntry(false);
        return;
      }

      const found = entries.find((e) => e.id === id);
      if (found) {
        setEntry(found);
        setIsFetchingEntry(false);
        return;
      }

      setIsFetchingEntry(true);
      const fetched = await fetchEntryById(id);
      if (isMounted) {
        setEntry(fetched);
        setIsFetchingEntry(false);
      }
    };

    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [id, entries, fetchEntryById]);

  useEffect(() => {
    if (!entry) return;
    fetchGoals(parseISO(entry.entry_date).getFullYear());
    goalsApi
      .getGoalsForEntry(entry.id)
      .then(setLinkedGoalIds)
      .catch(() => setLinkedGoalIds([]));
  }, [entry, fetchGoals]);

  const handleDelete = () => {
    Alert.alert(t('today.detail.deleteTitle'), t('today.detail.deleteMessage'), [
      { text: t('common.actions.cancel'), style: 'cancel' },
      {
        text: t('common.actions.delete'),
        style: 'destructive',
        onPress: async () => {
          if (entry) {
            await deleteEntry(entry.id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!entry) return;
    router.push({ pathname: '/entry/new', params: { date: entry.entry_date } });
  };

  if (isFetchingEntry) {
    return (
      <View style={styles.container}>
        <ModalHeader />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.container}>
        <ModalHeader />
        <View style={styles.centered}>
          <Text style={styles.notFound}>{t('today.detail.notAvailable')}</Text>
          <Button title={t('common.actions.goBack')} onPress={() => router.back()} variant="secondary" />
        </View>
      </View>
    );
  }

  const level = toMoodLevel(entry.mood);
  const mood = MOODS[level];
  const date = parseISO(entry.entry_date);
  const linkedGoals = goals.filter((g) => linkedGoalIds.includes(g.id));
  const visibility = VISIBILITY[entry.visibility || 'private'];
  const wasEdited = entry.updated_at !== entry.created_at;
  const burners = (entry.burners || []).filter(isBurner);

  return (
    <View style={styles.container}>
      <ModalHeader
        right={
          <>
            <IconButton name="create-outline" onPress={handleEdit} label={t('today.detail.editEntry')} />
            <IconButton name="trash-outline" onPress={handleDelete} label={t('today.detail.deleteEntry')} tone="danger" />
          </>
        }
      />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={[styles.hero, { backgroundColor: mood.tint }]}>
          <MoodFace mood={level} size={112} />
          <Text style={[styles.heroLabel, { color: mood.ink }]}>{mood.label}</Text>
          <Text style={[styles.heroDate, { color: mood.ink }]}>{fmtCap(date, t('today.dates.longWithYear'))}</Text>
        </Animated.View>

        {entry.note ? (
          <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.noteCard}>
            <Text style={styles.noteQuote}>“</Text>
            <Text style={styles.note}>{entry.note}</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(60).duration(350)} style={styles.noNote}>
            <Text style={styles.noNoteText}>{t('today.detail.noNote')}</Text>
            <Button title={t('today.detail.addNote')} variant="soft" size="sm" onPress={handleEdit} />
          </Animated.View>
        )}

        {linkedGoals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).duration(350)} style={styles.block}>
            <Text style={styles.blockLabel}>{t('today.detail.movedForwardOn')}</Text>
            <View style={styles.chips}>
              {linkedGoals.map((g) => (
                <Chip key={g.id} label={g.title} selected icon={g.is_completed ? 'checkmark-done' : 'flag-outline'} />
              ))}
            </View>
          </Animated.View>
        )}

        {burners.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.block}>
            <Text style={styles.blockLabel}>{t('today.detail.energyWentTo')}</Text>
            <View style={styles.chips}>
              {burners.map((b) => (
                <BurnerTag key={b} burner={b} size="md" />
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.meta}>
          <Pill label={t(visibility.labelKey)} icon={visibility.icon} tone="muted" />
          <Text style={styles.metaText}>
            {t('today.detail.logged', { time: fmt(new Date(entry.created_at), t('today.dates.dateTime')) })}
            {wasEdited ? t('today.detail.edited', { time: fmt(new Date(entry.updated_at), t('today.dates.dateTime')) }) : ''}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  notFound: {
    ...type.subhead,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  hero: {
    alignItems: 'center',
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  heroLabel: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  heroDate: {
    ...type.callout,
    opacity: 0.8,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.s20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteQuote: {
    fontFamily: fonts.displayBold,
    fontSize: 64,
    lineHeight: 48,
    color: colors.brandSoft,
    marginBottom: -spacing.md,
  },
  note: {
    fontFamily: fonts.displayItalic,
    fontSize: 19,
    lineHeight: 30,
    color: colors.ink,
  },
  noNote: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  noNoteText: {
    ...type.subhead,
    color: colors.inkMuted,
  },
  block: {
    gap: spacing.sm,
  },
  blockLabel: {
    ...type.label,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  meta: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaText: {
    ...type.caption,
    textAlign: 'center',
  },
});

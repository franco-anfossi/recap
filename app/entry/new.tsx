import { EntryForm } from '@/components/entry';
import { ModalHeader } from '@/components/ui';
import { colors, spacing, type } from '@/constants/theme';
import { useEntriesStore } from '@/stores';
import { format, isFuture, isToday, isValid, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function getSafeEntryDate(date: string | undefined): string {
  if (!date) return format(new Date(), 'yyyy-MM-dd');

  const parsedDate = parseISO(date);
  if (!isValid(parsedDate) || isFuture(parsedDate)) {
    return format(new Date(), 'yyyy-MM-dd');
  }

  return format(parsedDate, 'yyyy-MM-dd');
}

export default function NewEntryScreen() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const entryDate = getSafeEntryDate(date);
  const parsed = parseISO(entryDate);
  const existingEntry = useEntriesStore((state) =>
    state.entries.find((entry) => entry.entry_date === entryDate)
  );

  const header = (
    <View style={styles.dateBlock}>
      <Text style={styles.eyebrow}>{existingEntry ? 'Editing' : isToday(parsed) ? 'Today' : 'Backdated entry'}</Text>
      <Text style={styles.date}>{format(parsed, 'EEEE, MMMM d')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ModalHeader title={existingEntry ? 'Edit entry' : 'New entry'} onClose={() => router.back()} />
      <EntryForm date={entryDate} onSuccess={() => router.back()} header={header} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dateBlock: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  eyebrow: {
    ...type.label,
    color: colors.brand,
  },
  date: {
    ...type.title1,
  },
});

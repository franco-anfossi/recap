import { EntryForm } from '@/components/entry';
import { colors, spacing, typography } from '@/constants/theme';
import { format, isFuture, isValid, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Entry</Text>
        <View style={styles.headerSpacer} />
      </View>

      <EntryForm date={entryDate} onSuccess={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    color: colors.primary[600],
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  headerSpacer: {
    width: 64,
  },
});

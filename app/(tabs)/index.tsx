import { EntryForm } from '@/components/entry';
import { StreakCard } from '@/components/streak';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore, useEntriesStore } from '@/stores';
import { format, parseISO, subDays } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function TodayScreen() {
  const { entries, fetchEntriesByYear } = useEntriesStore();
  const { user } = useAuthStore();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    fetchEntriesByYear(currentYear);
  }, []);

  useEffect(() => {
    // Calculate streak
    if (entries.length === 0) {
      setStreak(0);
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const entryDates = new Set(entries.map(e => e.entry_date));

    let currentStreak = 0;
    let checkDate = today;

    // If today doesn't have an entry, start checking from yesterday
    if (!entryDates.has(today)) {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      if (!entryDates.has(yesterday)) {
        // No entry today or yesterday, streak is 0
        setStreak(0);
        return;
      }
      checkDate = yesterday;
    }

    // Count consecutive days
    while (entryDates.has(checkDate)) {
      currentStreak++;
      checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
    }

    setStreak(currentStreak);
  }, [entries]);

  return (
    <View style={styles.container}>
      <View style={styles.streakContainer}>
        <StreakCard streak={streak} />
      </View>
      <EntryForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  streakContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});

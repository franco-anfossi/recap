import { ModalHeader } from '@/components/ui';
import { getLegal } from '@/constants/legal';
import { colors, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const { doc: docParam } = useLocalSearchParams<{ doc: string }>();
  const doc = getLegal(docParam === 'terms' ? 'terms' : 'privacy');

  return (
    <View style={styles.container}>
      <ModalHeader onClose={() => router.back()} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{doc.title}</Text>
        <Text style={styles.updated}>{t('profile.legal.lastUpdated', { date: doc.updated })}</Text>
        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  title: {
    ...type.display,
  },
  updated: {
    ...type.caption,
    marginTop: -spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  heading: {
    ...type.title3,
  },
  body: {
    ...type.body,
    color: colors.inkSecondary,
  },
});

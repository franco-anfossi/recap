import { colors, spacing } from '@/constants/theme';
import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content (default) or a fixed-height layout. */
  scroll?: boolean;
  /** Apply top safe-area inset. Turn off inside modals/tab screens with their own header. */
  safeTop?: boolean;
  safeBottom?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps['refreshControl'];
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
}

export function Screen({
  children,
  scroll = true,
  safeTop = true,
  safeBottom = false,
  padded = true,
  style,
  contentStyle,
  refreshControl,
  keyboardShouldPersistTaps = 'handled',
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = safeTop ? insets.top + spacing.sm : 0;
  const paddingBottom = safeBottom ? insets.bottom + spacing.lg : spacing.xxl;

  if (!scroll) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop, paddingBottom: safeBottom ? insets.bottom : 0 },
          padded && styles.padded,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        { paddingTop, paddingBottom },
        padded && styles.padded,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      refreshControl={refreshControl}
      contentInsetAdjustmentBehavior="never"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.screen,
  },
});

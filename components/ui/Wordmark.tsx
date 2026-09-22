import { colors, fonts } from '@/constants/theme';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

interface WordmarkProps {
  size?: number;
  tone?: 'ink' | 'brand' | 'onBrand';
  style?: StyleProp<ViewStyle>;
}

/**
 * The recap wordmark: lowercase serif "recap" with an ember full stop.
 * The dot is the brand — it shows up in the app icon, splash and headers.
 */
export function Wordmark({ size = 28, tone = 'ink', style }: WordmarkProps) {
  const wordColor =
    tone === 'onBrand' ? colors.inkOnBrand : tone === 'brand' ? colors.brand : colors.ink;
  const dotColor = tone === 'onBrand' ? '#FFD1AE' : colors.brand;

  const textStyle: TextStyle = {
    fontFamily: fonts.displayBold,
    fontSize: size,
    lineHeight: size * 1.15,
    letterSpacing: -size * 0.04,
  };

  return (
    <View style={[styles.row, style]} accessibilityRole="header" accessibilityLabel="recap">
      <Text style={[textStyle, { color: wordColor }]}>recap</Text>
      <Text style={[textStyle, { color: dotColor }]}>.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

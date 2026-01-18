import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.gray[400]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface TextAreaProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  maxLength?: number;
}

export function TextArea({
  label,
  error,
  containerStyle,
  maxLength = 500,
  value,
  style,
  ...props
}: TextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value?.length || 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          styles.textArea,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.gray[400]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
        value={value}
        {...props}
      />
      <View style={styles.textAreaFooter}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <View />
        )}
        <Text style={styles.charCount}>
          {charCount}/{maxLength}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  inputFocused: {
    borderColor: colors.primary[400],
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  textAreaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  error: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});

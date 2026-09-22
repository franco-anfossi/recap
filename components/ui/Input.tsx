import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  error,
  hint,
  icon,
  containerStyle,
  style,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(!!secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          isFocused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? colors.brand : colors.inkMuted}
            style={styles.icon}
          />
        )}
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.inkMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          selectionColor={colors.brand}
          {...props}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setIsSecure((s) => !s)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          >
            <Ionicons
              name={isSecure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.inkMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

interface TextAreaProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  bare?: boolean;
}

export function TextArea({
  label,
  error,
  containerStyle,
  maxLength = 500,
  value,
  style,
  bare = false,
  ...props
}: TextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value?.length || 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          bare ? styles.bareField : styles.field,
          styles.textAreaField,
          !bare && isFocused && styles.fieldFocused,
          !bare && !!error && styles.fieldError,
        ]}
      >
        <RNTextInput
          style={[styles.input, styles.textArea, style]}
          placeholderTextColor={colors.inkMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          textAlignVertical="top"
          maxLength={maxLength}
          value={value}
          selectionColor={colors.brand}
          {...props}
        />
      </View>
      <View style={styles.textAreaFooter}>
        {error ? <Text style={styles.error}>{error}</Text> : <View />}
        <Text style={[styles.count, charCount >= maxLength && styles.countMax]}>
          {charCount}/{maxLength}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...type.caption,
    color: colors.inkSecondary,
    fontFamily: fonts.sansSemibold,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  bareField: {
    backgroundColor: 'transparent',
  },
  fieldFocused: {
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  icon: {
    marginRight: spacing.s12,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: spacing.s12,
    // The wrapper draws the focus ring; hide the browser's default outline on web.
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  textAreaField: {
    alignItems: 'stretch',
  },
  textArea: {
    minHeight: 120,
    lineHeight: 24,
    paddingTop: spacing.s12,
  },
  textAreaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    ...type.caption,
  },
  countMax: {
    color: colors.danger,
  },
  hint: {
    ...type.footnote,
    color: colors.inkMuted,
  },
  error: {
    ...type.footnote,
    color: colors.danger,
  },
});

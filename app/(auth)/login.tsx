import { Button, Input, Wordmark } from '@/components/ui';
import { colors, fonts, spacing, type } from '@/constants/theme';
import * as authApi from '@/lib/api/auth';
import { friendlyAuthError } from '@/lib/auth-errors';
import { useAuthStore } from '@/stores';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signIn, isLoading } = useAuthStore();

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }

    try {
      await signIn(email.trim(), password);
      // Root layout redirects once the session is in place.
    } catch (err: any) {
      setError(friendlyAuthError(err?.message));
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      Alert.alert('Reset password', 'Type your email above first, then tap “Forgot password?” again.');
      return;
    }
    try {
      await authApi.resetPassword(email.trim());
      Alert.alert('Check your inbox', `We sent a reset link to ${email.trim()}.`);
    } catch (err: any) {
      Alert.alert('Could not send reset link', err?.message || 'Try again in a moment.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Wordmark size={28} />

        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Pick up where you left off.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.form}>
          <Input
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />

          <Input
            label="Password"
            icon="lock-closed-outline"
            placeholder="Your password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable onPress={handleForgot} hitSlop={8} style={styles.forgot} accessibilityRole="button">
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Button
            title="Sign in"
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
            fullWidth
          />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to recap? </Text>
          <Link href="/(auth)/register" replace asChild>
            <Pressable hitSlop={8} accessibilityRole="link">
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
  },
  header: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...type.hero,
  },
  subtitle: {
    ...type.body,
    color: colors.inkSecondary,
    fontSize: 17,
  },
  form: {
    gap: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    padding: spacing.s12,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  errorText: {
    ...type.footnote,
    color: colors.danger,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotText: {
    ...type.footnote,
    fontFamily: fonts.sansSemibold,
    color: colors.brandStrong,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  footerText: {
    ...type.subhead,
  },
  link: {
    ...type.subhead,
    fontFamily: fonts.sansSemibold,
    color: colors.brandStrong,
  },
});

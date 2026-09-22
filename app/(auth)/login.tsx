import { Button, Input, Wordmark } from '@/components/ui';
import { colors, fonts, spacing, type } from '@/constants/theme';
import * as authApi from '@/lib/api/auth';
import { friendlyAuthError } from '@/lib/auth-errors';
import { t } from '@/lib/i18n';
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
      setError(t('auth.login.errors.missingFields'));
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
      Alert.alert(t('auth.login.reset.needEmailTitle'), t('auth.login.reset.needEmailBody'));
      return;
    }
    try {
      await authApi.resetPassword(email.trim());
      Alert.alert(t('auth.login.reset.sentTitle'), t('auth.login.reset.sentBody', { email: email.trim() }));
    } catch (err: any) {
      Alert.alert(t('auth.login.reset.failedTitle'), err?.message || t('auth.login.reset.failedBody'));
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
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.form}>
          <Input
            label={t('auth.login.emailLabel')}
            icon="mail-outline"
            placeholder={t('auth.login.emailPlaceholder')}
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
            label={t('auth.login.passwordLabel')}
            icon="lock-closed-outline"
            placeholder={t('auth.login.passwordPlaceholder')}
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
            <Text style={styles.forgotText}>{t('auth.login.forgot')}</Text>
          </Pressable>

          <Button
            title={t('auth.login.submit')}
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
            fullWidth
          />
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.login.newHere')}</Text>
          <Link href="/(auth)/register" replace asChild>
            <Pressable hitSlop={8} accessibilityRole="link">
              <Text style={styles.link}>{t('auth.login.createAccount')}</Text>
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

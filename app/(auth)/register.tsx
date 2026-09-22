import { Button, Input, Wordmark } from '@/components/ui';
import { colors, fonts, spacing, type } from '@/constants/theme';
import { useAuthStore } from '@/stores';
import { Link, router } from 'expo-router';
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
import { friendlyAuthError } from '@/lib/auth-errors';
import { t } from '@/lib/i18n';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signUp, isLoading } = useAuthStore();

  const handleRegister = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.register.errors.missingFields'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.register.errors.passwordTooShort'));
      return;
    }

    try {
      const user = await signUp(email.trim(), password, name || undefined);

      if (!user) {
        // Email confirmation is on: the session only exists after they confirm.
        Alert.alert(t('auth.register.confirmTitle'), t('auth.register.confirmBody'));
        router.replace('/(auth)/login');
      }
      // Otherwise the root layout sends them into setup.
    } catch (err: any) {
      setError(friendlyAuthError(err?.message));
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
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.form}>
          <Input
            label={t('auth.register.nameLabel')}
            icon="person-outline"
            placeholder={t('auth.register.namePlaceholder')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
          />

          <Input
            label={t('auth.register.emailLabel')}
            icon="mail-outline"
            placeholder={t('auth.register.emailPlaceholder')}
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
            label={t('auth.register.passwordLabel')}
            icon="lock-closed-outline"
            placeholder={t('auth.register.passwordPlaceholder')}
            hint={t('auth.register.passwordHint')}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleRegister}
          />

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title={t('auth.register.submit')}
            onPress={handleRegister}
            loading={isLoading}
            size="lg"
            fullWidth
            style={styles.submit}
          />

          <Text style={styles.legal}>{t('auth.register.legal')}</Text>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.register.alreadyHaveAccount')}</Text>
          <Link href="/(auth)/login" replace asChild>
            <Pressable hitSlop={8} accessibilityRole="link">
              <Text style={styles.link}>{t('auth.register.signIn')}</Text>
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
    marginTop: spacing.xl,
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
  submit: {
    marginTop: spacing.xs,
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
  legal: {
    ...type.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
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

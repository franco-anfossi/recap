import { Button, Input, Wordmark } from '@/components/ui';
import { colors, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { setPasswordRecovery, checkAuth } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t('auth.resetPassword.errors.tooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.resetPassword.errors.mismatch'));
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPasswordRecovery(false);
      await checkAuth();
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message || t('auth.resetPassword.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Wordmark size={28} />

        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>{t('auth.resetPassword.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.resetPassword.subtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.form}>
          <Input
            label={t('auth.resetPassword.newPasswordLabel')}
            icon="lock-closed-outline"
            placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError(null);
            }}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
          />
          <Input
            label={t('auth.resetPassword.repeatLabel')}
            icon="lock-closed-outline"
            placeholder={t('auth.resetPassword.repeatPlaceholder')}
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v);
              if (error) setError(null);
            }}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={submit}
          />

          {error && (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button title={t('auth.resetPassword.submit')} onPress={submit} loading={saving} size="lg" fullWidth />
        </Animated.View>
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
});

import { t } from '@/lib/i18n';

export function friendlyAuthError(message?: string) {
  if (!message) return t('common.errors.generic');
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return t('auth.errors.invalidLogin');
  if (m.includes('email not confirmed')) return t('auth.errors.emailNotConfirmed');
  if (m.includes('already registered')) return t('auth.errors.alreadyRegistered');
  if (m.includes('network')) return t('auth.errors.network');
  return message;
}

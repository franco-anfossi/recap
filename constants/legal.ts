// In-app legal texts, in English and Spanish. Plain language, kept short on purpose.
// Review with a lawyer before publishing; update `updated` whenever the text changes.
import { locale } from '@/lib/i18n';

export type LegalDocKey = 'privacy' | 'terms';

export interface LegalDoc {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

const EN: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Privacy policy',
    updated: 'September 22, 2026',
    sections: [
      {
        heading: 'What we store',
        body: 'Your email, the name you choose, your daily check-ins (mood, note, burners), your intentions and who you follow. Nothing else is collected.',
      },
      {
        heading: 'Who can see it',
        body: 'Check-ins are private by default. You decide per entry whether friends or everyone can see it. Your intentions are never shown to other people; only the burner an entry fed is.',
      },
      {
        heading: 'Where it lives',
        body: 'Data is stored with Supabase, our hosting provider, protected by row-level security so only you (and the people you explicitly share with) can read it.',
      },
      {
        heading: 'Reminders',
        body: 'Daily reminders are scheduled on your device only. We do not send push notifications from a server and never read your notification settings.',
      },
      {
        heading: 'Deleting your data',
        body: 'You can delete your account from the profile screen. It removes your account and everything attached to it immediately and permanently.',
      },
      {
        heading: 'Contact',
        body: 'Questions about privacy: hello@recap.app.',
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    updated: 'September 22, 2026',
    sections: [
      {
        heading: 'The service',
        body: 'recap is a personal journal. It helps you notice patterns; it is not medical advice and does not replace professional care. If you are struggling, please reach out to someone you trust or a local helpline.',
      },
      {
        heading: 'Your account',
        body: 'You need to be at least 16 to use recap. Keep your password private. You are responsible for what you post, including entries you choose to share with friends or publicly.',
      },
      {
        heading: 'Being decent',
        body: 'Do not use recap to harass, impersonate or spam other people. We may remove content or accounts that do.',
      },
      {
        heading: 'Availability',
        body: 'We do our best to keep recap running, but it is provided as is. We may change or discontinue features. Your data stays yours and can be deleted at any time.',
      },
      {
        heading: 'Contact',
        body: 'Questions about these terms: hello@recap.app.',
      },
    ],
  },
};

const ES: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Política de privacidad',
    updated: '22 de septiembre de 2026',
    sections: [
      {
        heading: 'Qué guardamos',
        body: 'Tu email, el nombre que elijas, tus registros diarios (ánimo, nota, fuegos), tus intenciones y a quién sigues. No recogemos nada más.',
      },
      {
        heading: 'Quién puede verlo',
        body: 'Los registros son privados por defecto. En cada uno decides si lo ven tus amigos o todo el mundo. Tus intenciones nunca se muestran a otras personas; solo el fuego al que alimentó cada registro.',
      },
      {
        heading: 'Dónde vive',
        body: 'Los datos se guardan en Supabase, nuestro proveedor de hosting, protegidos con seguridad a nivel de fila para que solo tú (y las personas con las que compartas explícitamente) puedan leerlos.',
      },
      {
        heading: 'Recordatorios',
        body: 'Los recordatorios diarios se programan solo en tu dispositivo. No enviamos notificaciones desde un servidor ni leemos tu configuración de notificaciones.',
      },
      {
        heading: 'Eliminar tus datos',
        body: 'Puedes eliminar tu cuenta desde la pantalla de perfil. Borra tu cuenta y todo lo asociado a ella de inmediato y de forma permanente.',
      },
      {
        heading: 'Contacto',
        body: 'Dudas sobre privacidad: hello@recap.app.',
      },
    ],
  },
  terms: {
    title: 'Términos de uso',
    updated: '22 de septiembre de 2026',
    sections: [
      {
        heading: 'El servicio',
        body: 'recap es un diario personal. Te ayuda a notar patrones; no es consejo médico ni reemplaza atención profesional. Si lo estás pasando mal, acude a alguien de confianza o a una línea de ayuda local.',
      },
      {
        heading: 'Tu cuenta',
        body: 'Necesitas tener al menos 16 años para usar recap. Mantén tu contraseña en privado. Eres responsable de lo que publicas, incluidos los registros que decidas compartir con amigos o públicamente.',
      },
      {
        heading: 'Buen trato',
        body: 'No uses recap para acosar, suplantar o hacer spam a otras personas. Podemos eliminar contenido o cuentas que lo hagan.',
      },
      {
        heading: 'Disponibilidad',
        body: 'Hacemos lo posible por mantener recap funcionando, pero se ofrece tal cual. Podemos cambiar o retirar funciones. Tus datos siguen siendo tuyos y puedes borrarlos cuando quieras.',
      },
      {
        heading: 'Contacto',
        body: 'Dudas sobre estos términos: hello@recap.app.',
      },
    ],
  },
};

export const LEGAL: Record<LegalDocKey, LegalDoc> = locale === 'es' ? ES : EN;

export function getLegal(doc: string | undefined): LegalDoc {
  return LEGAL[doc === 'terms' ? 'terms' : 'privacy'];
}

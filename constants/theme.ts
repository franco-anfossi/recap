// recap design tokens — "ember & paper"
// Warm ember orange on cream paper, editorial serif headlines, humanist sans body.
// Every visual value used anywhere in the app comes from this file.

import { TextStyle } from 'react-native';

export const palette = {
  ember: {
    50: '#FFF6EE',
    100: '#FFE8D6',
    200: '#FFD1AE',
    300: '#FFB27C',
    400: '#FF8E48',
    500: '#F26A1B',
    600: '#D9560F',
    700: '#B3430C',
    800: '#8C340B',
    900: '#5E2307',
  },
  paper: {
    0: '#FFFFFF',
    50: '#FDFAF6',
    100: '#F7F1E9',
    200: '#EEE5D9',
    300: '#DFD2C2',
    400: '#B9AB99',
    500: '#8E8172',
    600: '#6B6054',
    700: '#4A423A',
    800: '#2E2924',
    900: '#1B1714',
  },
} as const;

export const colors = {
  // Brand
  brand: palette.ember[500],
  brandStrong: palette.ember[600],
  brandDeep: palette.ember[800],
  brandSoft: palette.ember[100],
  brandTint: palette.ember[50],

  // Surfaces
  background: '#FBF7F2',
  surface: palette.paper[0],
  surfaceMuted: palette.paper[100],
  surfaceSunken: palette.paper[200],
  overlay: 'rgba(27, 23, 20, 0.55)',

  // Lines
  border: palette.paper[200],
  borderStrong: palette.paper[300],
  hairline: 'rgba(27, 23, 20, 0.08)',

  // Ink
  ink: palette.paper[900],
  inkSecondary: palette.paper[600],
  inkMuted: palette.paper[400],
  inkOnBrand: '#FFFFFF',

  // Semantic
  success: '#3F9A74',
  successSoft: '#DCF0E6',
  warning: '#E3A93C',
  warningSoft: '#FBEFD3',
  danger: '#C6483B',
  dangerSoft: '#F9E4E0',

  // Legacy aliases kept so nothing outside the theme breaks.
  primary: palette.ember,
  gray: palette.paper,
  error: '#C6483B',
  text: {
    primary: palette.paper[900],
    secondary: palette.paper[600],
    muted: palette.paper[400],
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  // Named in-between steps that recur across screens.
  s12: 12,
  s20: 20,
  screen: 20,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

// Backwards-compatible alias.
export const borderRadius = {
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  full: radius.full,
} as const;

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_500Medium_Italic',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemibold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

// Named text styles. Screens never touch fontSize directly.
export const type = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
    color: colors.ink,
  },
  display: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  title1: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  title2: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  title3: {
    fontFamily: fonts.sansSemibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  headline: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  bodyMedium: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  callout: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  subhead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkSecondary,
  },
  footnote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSecondary,
  },
  caption: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.inkMuted,
  },
  label: {
    fontFamily: fonts.sansSemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  stat: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  button: {
    fontFamily: fonts.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

// Legacy typography object kept for any stray consumer.
export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const shadows = {
  sm: { boxShadow: '0 1px 3px rgba(27, 23, 20, 0.05)' },
  md: { boxShadow: '0 4px 12px rgba(27, 23, 20, 0.07)' },
  lg: { boxShadow: '0 10px 24px rgba(27, 23, 20, 0.12)' },
  brand: { boxShadow: '0 8px 16px rgba(217, 86, 15, 0.28)' },
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const gradients = {
  ember: ['#FF8E48', '#F26A1B', '#D9560F'] as const,
  sunset: ['#FFB27C', '#F26A1B', '#8C340B'] as const,
  paper: ['#FFFFFF', '#FBF7F2'] as const,
  dusk: ['#2E2924', '#1B1714'] as const,
} as const;

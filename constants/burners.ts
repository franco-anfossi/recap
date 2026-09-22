// The Four Burners: health, work, family, friends.
// You can't keep all four on high. recap makes the trade-off visible instead of pretending it away.
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';

export type Burner = 'health' | 'work' | 'family' | 'friends';

export const BURNER_KEYS: Burner[] = ['health', 'work', 'family', 'friends'];

export interface BurnerInfo {
  key: Burner;
  /** Localized label. */
  readonly label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  ink: string;
}

export const BURNERS: Record<Burner, BurnerInfo> = {
  health: {
    key: 'health',
    get label() {
      return t('common.burners.health');
    },
    icon: 'fitness',
    iconOutline: 'fitness-outline',
    color: '#2F8F9D',
    tint: '#DDF0F2',
    ink: '#1B5A63',
  },
  work: {
    key: 'work',
    get label() {
      return t('common.burners.work');
    },
    icon: 'briefcase',
    iconOutline: 'briefcase-outline',
    color: '#D9560F',
    tint: '#FFE8D6',
    ink: '#8C340B',
  },
  family: {
    key: 'family',
    get label() {
      return t('common.burners.family');
    },
    icon: 'home',
    iconOutline: 'home-outline',
    color: '#9A5B9E',
    tint: '#F0E3F1',
    ink: '#5E3462',
  },
  friends: {
    key: 'friends',
    get label() {
      return t('common.burners.friends');
    },
    icon: 'people',
    iconOutline: 'people-outline',
    color: '#D89B2B',
    tint: '#FBEFD3',
    ink: '#7D5410',
  },
};

export const isBurner = (value: unknown): value is Burner =>
  typeof value === 'string' && (BURNER_KEYS as string[]).includes(value);

export const getBurner = (key: Burner): BurnerInfo => BURNERS[key];

// Mood levels for the journal.
// Colors are a warm, harmonized spectrum that sits on the ember/paper palette.
// Labels resolve through i18n so they follow the device language.
import { t } from '@/lib/i18n';

const MOOD_COLORS = {
  1: { emoji: '😞', color: '#B8493C', tint: '#F9E3DF', ink: '#7A2A22' },
  2: { emoji: '😔', color: '#E07B4F', tint: '#FCE8DD', ink: '#8F4223' },
  3: { emoji: '😐', color: '#E3A93C', tint: '#FBEFD3', ink: '#7D5410' },
  4: { emoji: '🙂', color: '#8FAE4E', tint: '#EDF2DA', ink: '#4A5F1C' },
  5: { emoji: '😄', color: '#3F9A74', tint: '#DCF0E6', ink: '#1F5C43' },
} as const;

export type MoodLevel = keyof typeof MOOD_COLORS;

export interface MoodInfo {
  emoji: string;
  color: string;
  tint: string;
  ink: string;
  /** Localized short label, e.g. "Good". */
  readonly label: string;
  /** Localized adjective used in sentences, e.g. "What made it good?". */
  readonly word: string;
}

function build(level: MoodLevel): MoodInfo {
  return {
    ...MOOD_COLORS[level],
    get label() {
      return t(`common.moods.${level}.label`);
    },
    get word() {
      return t(`common.moods.${level}.word`);
    },
  };
}

export const MOODS: Record<MoodLevel, MoodInfo> = {
  1: build(1),
  2: build(2),
  3: build(3),
  4: build(4),
  5: build(5),
};

export const MOOD_LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

export const toMoodLevel = (level: number): MoodLevel => {
  const roundedLevel = Math.round(level);

  if (roundedLevel >= 1 && roundedLevel <= 5) {
    return roundedLevel as MoodLevel;
  }

  return 3;
};

export const getMoodInfo = (level: MoodLevel): MoodInfo => MOODS[level];
export const getMoodColor = (level: MoodLevel): string => MOODS[level].color;
export const getMoodEmoji = (level: MoodLevel): string => MOODS[level].emoji;

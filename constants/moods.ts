// Mood levels for the journal - warmer color palette
export const MOODS = {
  1: { label: 'Awful', emoji: '😞', color: '#DC2626' },
  2: { label: 'Bad', emoji: '😔', color: '#EA580C' },
  3: { label: 'Okay', emoji: '😐', color: '#D97706' },
  4: { label: 'Good', emoji: '🙂', color: '#65A30D' },
  5: { label: 'Great', emoji: '😄', color: '#16A34A' },
} as const;

export type MoodLevel = keyof typeof MOODS;
export type MoodInfo = (typeof MOODS)[MoodLevel];

export const getMoodInfo = (level: MoodLevel): MoodInfo => MOODS[level];
export const getMoodColor = (level: MoodLevel): string => MOODS[level].color;
export const getMoodEmoji = (level: MoodLevel): string => MOODS[level].emoji;

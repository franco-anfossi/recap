// Mood levels for the journal.
// Colors are a warm, harmonized spectrum that sits on the ember/paper palette.
export const MOODS = {
  1: { label: 'Awful', emoji: '😞', color: '#B8493C', tint: '#F9E3DF', ink: '#7A2A22', word: 'rough' },
  2: { label: 'Bad', emoji: '😔', color: '#E07B4F', tint: '#FCE8DD', ink: '#8F4223', word: 'off' },
  3: { label: 'Okay', emoji: '😐', color: '#E3A93C', tint: '#FBEFD3', ink: '#7D5410', word: 'okay' },
  4: { label: 'Good', emoji: '🙂', color: '#8FAE4E', tint: '#EDF2DA', ink: '#4A5F1C', word: 'good' },
  5: { label: 'Great', emoji: '😄', color: '#3F9A74', tint: '#DCF0E6', ink: '#1F5C43', word: 'great' },
} as const;

export type MoodLevel = keyof typeof MOODS;
export type MoodInfo = (typeof MOODS)[MoodLevel];

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

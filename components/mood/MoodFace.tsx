import { MOODS, MoodLevel } from '@/constants/moods';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface MoodFaceProps {
  mood: MoodLevel;
  size?: number;
  /** Render in grayscale-ish muted tone (unselected state). */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Mouth shapes in a 100x100 viewBox.
const MOUTHS: Record<MoodLevel, { d: string; filled?: boolean }> = {
  1: { d: 'M31 74 Q50 54 69 74' },
  2: { d: 'M34 70 Q50 60 66 70' },
  3: { d: 'M34 67 L66 67' },
  4: { d: 'M32 62 Q50 78 68 62' },
  5: { d: 'M28 58 Q50 90 72 58 Z', filled: true },
};

/**
 * recap's signature mood glyph: a soft circle face whose color and mouth carry the mood.
 * Used everywhere a mood appears (picker, calendar, feed, insights) so the language stays consistent.
 */
export function MoodFace({ mood, size = 48, muted = false, style }: MoodFaceProps) {
  const info = MOODS[mood];
  const mouth = MOUTHS[mood];
  const fill = muted ? '#EEE5D9' : info.color;
  const ink = muted ? '#B9AB99' : info.ink;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <Circle cx="50" cy="50" r="48" fill={fill} />
      {/* subtle highlight */}
      {!muted && <Circle cx="36" cy="30" r="14" fill="#FFFFFF" opacity={0.18} />}
      <Circle cx="35" cy="43" r="5.5" fill={ink} />
      <Circle cx="65" cy="43" r="5.5" fill={ink} />
      <Path
        d={mouth.d}
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mouth.filled ? ink : 'none'}
      />
    </Svg>
  );
}

interface MoodDotProps {
  mood: MoodLevel | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Tiny colored square/dot for heatmaps and strips. */
export function MoodDot({ mood, size = 12, style }: MoodDotProps) {
  const color = mood ? MOODS[mood].color : '#EEE5D9';
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" style={style}>
      <Path d="M2 0h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" fill={color} />
    </Svg>
  );
}

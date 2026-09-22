import { MoodDot, MoodFace } from '@/components/mood';
import { Button, Wordmark } from '@/components/ui';
import { MOODS, MOOD_LEVELS, MoodLevel } from '@/constants/moods';
import { colors, fonts, radius, shadows, spacing, type } from '@/constants/theme';
import { useOnboardingStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  art: React.ComponentType;
};

const SLIDES: Slide[] = [
  {
    key: 'checkin',
    eyebrow: 'One tap a day',
    title: 'How was today, honestly?',
    body: 'Pick a face, add a line if you want. It takes ten seconds and it adds up to something.',
    art: MoodRowArt,
  },
  {
    key: 'calendar',
    eyebrow: 'Your month, at a glance',
    title: 'See the shape of your weeks.',
    body: 'Every check-in lands on your calendar. Good stretches and rough patches become visible.',
    art: CalendarArt,
  },
  {
    key: 'insights',
    eyebrow: 'Patterns, not guesses',
    title: 'Notice what actually moves you.',
    body: 'Monthly averages, streaks and breakdowns built from your real entries. No fluff.',
    art: ChartArt,
  },
  {
    key: 'recap',
    eyebrow: 'At the end of the year',
    title: 'Your year, recapped.',
    body: 'A grounded summary of your year: best months, most common moods and the goals you kept.',
    art: RecapArt,
  },
];

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<Animated.FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const markWelcomeSeen = useOnboardingStore((s) => s.markWelcomeSeen);

  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const goTo = (target: 'register' | 'login') => {
    markWelcomeSeen();
    router.replace(target === 'register' ? '/(auth)/register' : '/(auth)/login');
  };

  const next = () => {
    if (isLast) {
      goTo('register');
      return;
    }
    listRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topBar}>
        <Wordmark size={26} />
        {!isLast && (
          <Pressable onPress={() => goTo('register')} hitSlop={8} accessibilityRole="button">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        )}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item, index: i }) => (
          <SlideView slide={item} index={i} width={width} scrollX={scrollX} />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>

        <Button
          title={isLast ? 'Create your account' : 'Continue'}
          onPress={next}
          size="lg"
          fullWidth
          icon={isLast ? undefined : 'arrow-forward'}
          iconPosition="right"
        />

        <Pressable onPress={() => goTo('login')} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>
            Already have an account? <Text style={styles.secondaryLink}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------

function SlideView({
  slide,
  index,
  width,
  scrollX,
}: {
  slide: Slide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  const Art = slide.art;
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const artStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollX.value, inputRange, [width * 0.25, 0, -width * 0.25], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, inputRange, [16, 0, 16], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.artWrap, artStyle]}>
        <Art />
      </Animated.View>
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, inputRange, [8, 28, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// ---------------------------------------------------------------------------
// Illustrations — built from the real design language so the app feels familiar on first open
// ---------------------------------------------------------------------------

function ArtFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.artFrame}>
      <View style={styles.artBlobA} />
      <View style={styles.artBlobB} />
      <View style={styles.artCard}>{children}</View>
    </View>
  );
}

function MoodRowArt() {
  return (
    <ArtFrame>
      <Text style={styles.artQuestion}>How was your day?</Text>
      <View style={styles.artMoodRow}>
        {MOOD_LEVELS.map((level) => {
          const selected = level === 4;
          return (
            <View key={level} style={[styles.artMoodItem, selected && styles.artMoodItemSelected]}>
              <MoodFace mood={level} size={selected ? 52 : 40} muted={!selected && level !== 5} />
              <Text style={[styles.artMoodLabel, selected && { color: MOODS[level].ink }]}>
                {MOODS[level].label}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.artNote}>
        <Text style={styles.artNoteText}>Long walk after work. Slept well.</Text>
      </View>
    </ArtFrame>
  );
}

const CALENDAR_MOODS: (MoodLevel | null)[] = [
  null, null, 4, 5, 3, 4, 4,
  3, 2, 3, 4, 5, 5, 4,
  4, 4, 3, 1, 2, 3, 4,
  5, 4, 4, 5, 3, 4, null,
];

function CalendarArt() {
  return (
    <ArtFrame>
      <View style={styles.artCalHeader}>
        <Text style={styles.artCalTitle}>September</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
      </View>
      <View style={styles.artGrid}>
        {CALENDAR_MOODS.map((mood, i) => (
          <View key={i} style={styles.artCell}>
            {mood ? <MoodFace mood={mood} size={26} /> : <View style={styles.artCellEmpty} />}
          </View>
        ))}
      </View>
    </ArtFrame>
  );
}

const CHART: { level: MoodLevel; h: number }[] = [
  { level: 3, h: 0.55 }, { level: 4, h: 0.7 }, { level: 2, h: 0.4 }, { level: 3, h: 0.6 },
  { level: 4, h: 0.78 }, { level: 5, h: 0.92 }, { level: 4, h: 0.8 }, { level: 5, h: 0.95 },
];

function ChartArt() {
  return (
    <ArtFrame>
      <View style={styles.artCalHeader}>
        <Text style={styles.artCalTitle}>Monthly average</Text>
        <View style={styles.artTrend}>
          <Ionicons name="trending-up" size={14} color={colors.success} />
          <Text style={styles.artTrendText}>+0.8</Text>
        </View>
      </View>
      <View style={styles.artChart}>
        {CHART.map((bar, i) => (
          <View key={i} style={styles.artBarCol}>
            <View style={styles.artBarTrack}>
              <View
                style={[
                  styles.artBar,
                  { height: `${bar.h * 100}%`, backgroundColor: MOODS[bar.level].color },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.artLegend}>
        {MOOD_LEVELS.map((l) => (
          <MoodDot key={l} mood={l} size={10} />
        ))}
        <Text style={styles.artLegendText}>rough to great</Text>
      </View>
    </ArtFrame>
  );
}

function RecapArt() {
  return (
    <ArtFrame>
      <View style={styles.artRecapHero}>
        <Text style={styles.artRecapYear}>2026</Text>
        <Text style={styles.artRecapTitle}>Your year in moods</Text>
      </View>
      <View style={styles.artTiles}>
        <View style={styles.artTile}>
          <Text style={styles.artTileLabel}>Check-ins</Text>
          <Text style={styles.artTileValue}>312</Text>
        </View>
        <View style={styles.artTile}>
          <Text style={styles.artTileLabel}>Best month</Text>
          <Text style={styles.artTileValue}>June</Text>
        </View>
        <View style={styles.artTile}>
          <Text style={styles.artTileLabel}>Mostly</Text>
          <View style={styles.artTileFace}>
            <MoodFace mood={4} size={22} />
            <Text style={styles.artTileValueSm}>Good</Text>
          </View>
        </View>
      </View>
    </ArtFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  skip: {
    ...type.callout,
    color: colors.inkSecondary,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  artWrap: {
    alignItems: 'center',
  },
  textBlock: {
    gap: spacing.s12,
    paddingHorizontal: spacing.xs,
  },
  eyebrow: {
    ...type.label,
    color: colors.brand,
  },
  title: {
    ...type.hero,
    fontSize: 36,
    lineHeight: 40,
  },
  body: {
    ...type.body,
    color: colors.inkSecondary,
    fontSize: 17,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  secondaryText: {
    ...type.subhead,
  },
  secondaryLink: {
    color: colors.brandStrong,
    fontFamily: fonts.sansSemibold,
  },

  // Art
  artFrame: {
    width: '100%',
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artBlobA: {
    position: 'absolute',
    width: '78%',
    aspectRatio: 1,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    top: '4%',
    left: '-6%',
    opacity: 0.8,
  },
  artBlobB: {
    position: 'absolute',
    width: '46%',
    aspectRatio: 1,
    borderRadius: radius.full,
    backgroundColor: colors.brand,
    bottom: '2%',
    right: '-4%',
    opacity: 0.16,
  },
  artCard: {
    width: '88%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: spacing.s20,
    gap: spacing.md,
    ...shadows.lg,
  },
  artQuestion: {
    ...type.title2,
  },
  artMoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  artMoodItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  artMoodItemSelected: {
    transform: [{ translateY: -4 }],
  },
  artMoodLabel: {
    ...type.caption,
  },
  artNote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.s12,
  },
  artNoteText: {
    ...type.subhead,
    fontFamily: fonts.displayItalic,
    color: colors.inkSecondary,
  },
  artCalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  artCalTitle: {
    ...type.title2,
  },
  artGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  artCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artCellEmpty: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  artTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  artTrendText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 12,
    color: colors.success,
  },
  artChart: {
    flexDirection: 'row',
    height: 120,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  artBarCol: {
    flex: 1,
    height: '100%',
  },
  artBarTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  artBar: {
    width: '100%',
    borderRadius: radius.sm,
  },
  artLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  artLegendText: {
    ...type.caption,
    marginLeft: spacing.xs,
  },
  artRecapHero: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.xs,
  },
  artRecapYear: {
    fontFamily: fonts.displayBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
    color: colors.inkOnBrand,
  },
  artRecapTitle: {
    ...type.callout,
    color: '#FFE8D6',
  },
  artTiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  artTile: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.s12,
    gap: spacing.xs,
  },
  artTileLabel: {
    ...type.caption,
  },
  artTileValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
  },
  artTileValueSm: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
  },
  artTileFace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

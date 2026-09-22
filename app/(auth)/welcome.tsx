import { MoodDot, MoodFace } from '@/components/mood';
import { Button, Wordmark } from '@/components/ui';
import { BURNER_KEYS, BURNERS } from '@/constants/burners';
import { MOODS, MOOD_LEVELS, MoodLevel } from '@/constants/moods';
import { colors, fonts, radius, shadows, spacing, type } from '@/constants/theme';
import { fmtCap } from '@/lib/dates';
import { t } from '@/lib/i18n';
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
    eyebrow: t('auth.welcome.slides.checkin.eyebrow'),
    title: t('auth.welcome.slides.checkin.title'),
    body: t('auth.welcome.slides.checkin.body'),
    art: MoodRowArt,
  },
  {
    key: 'calendar',
    eyebrow: t('auth.welcome.slides.calendar.eyebrow'),
    title: t('auth.welcome.slides.calendar.title'),
    body: t('auth.welcome.slides.calendar.body'),
    art: CalendarArt,
  },
  {
    key: 'insights',
    eyebrow: t('auth.welcome.slides.insights.eyebrow'),
    title: t('auth.welcome.slides.insights.title'),
    body: t('auth.welcome.slides.insights.body'),
    art: ChartArt,
  },
  {
    key: 'burners',
    eyebrow: t('auth.welcome.slides.burners.eyebrow'),
    title: t('auth.welcome.slides.burners.title'),
    body: t('auth.welcome.slides.burners.body'),
    art: BurnersArt,
  },
  {
    key: 'recap',
    eyebrow: t('auth.welcome.slides.recap.eyebrow'),
    title: t('auth.welcome.slides.recap.title'),
    body: t('auth.welcome.slides.recap.body'),
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
            <Text style={styles.skip}>{t('auth.welcome.skip')}</Text>
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
          title={isLast ? t('auth.welcome.createAccount') : t('common.actions.continue')}
          onPress={next}
          size="lg"
          fullWidth
          icon={isLast ? undefined : 'arrow-forward'}
          iconPosition="right"
        />

        <Pressable onPress={() => goTo('login')} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>
            {t('auth.welcome.alreadyHaveAccount')} <Text style={styles.secondaryLink}>{t('auth.welcome.signIn')}</Text>
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
      <Text style={styles.artQuestion}>{t('auth.welcome.art.moodQuestion')}</Text>
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
        <Text style={styles.artNoteText}>{t('auth.welcome.art.moodNote')}</Text>
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
        <Text style={styles.artCalTitle}>{fmtCap(new Date(2026, 8, 1), 'MMMM')}</Text>
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
        <Text style={styles.artCalTitle}>{t('auth.welcome.art.monthlyAverage')}</Text>
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
        <Text style={styles.artLegendText}>{t('auth.welcome.art.legend')}</Text>
      </View>
    </ArtFrame>
  );
}

const BURNER_LEVELS = { health: 0.8, work: 0.95, family: 0.6, friends: 0.25 } as const;

function BurnersArt() {
  return (
    <ArtFrame>
      <View style={styles.artCalHeader}>
        <Text style={styles.artCalTitle}>{t('auth.welcome.art.energyTitle')}</Text>
        <Text style={styles.artLegendText}>{t('auth.welcome.art.energyPeriod')}</Text>
      </View>
      <View style={styles.artBurners}>
        {BURNER_KEYS.map((key) => {
          const info = BURNERS[key];
          const level = BURNER_LEVELS[key];
          const dimmed = key === 'friends';
          return (
            <View key={key} style={[styles.artBurner, { backgroundColor: info.tint }, dimmed && styles.artBurnerDimmed]}>
              <View style={[styles.artBurnerIcon, { backgroundColor: info.color }]}>
                <Ionicons name={info.icon} size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.artBurnerLabel, { color: info.ink }]}>{info.label}</Text>
              <View style={styles.artBurnerTrack}>
                <View style={[styles.artBurnerFill, { width: `${level * 100}%`, backgroundColor: info.color }]} />
              </View>
              {dimmed && <Text style={[styles.artBurnerNote, { color: info.ink }]}>{t('common.burners.turnedDown')}</Text>}
            </View>
          );
        })}
      </View>
    </ArtFrame>
  );
}

function RecapArt() {
  return (
    <ArtFrame>
      <View style={styles.artRecapHero}>
        <Text style={styles.artRecapYear}>2026</Text>
        <Text style={styles.artRecapTitle}>{t('auth.welcome.art.recapTitle')}</Text>
      </View>
      <View style={styles.artTiles}>
        <View style={styles.artTile}>
          <Text style={styles.artTileLabel}>{t('auth.welcome.art.checkins')}</Text>
          <Text style={styles.artTileValue}>312</Text>
        </View>
        <View style={styles.artTile}>
          <Text style={styles.artTileLabel}>{t('auth.welcome.art.bestMonth')}</Text>
          <Text style={styles.artTileValue}>{fmtCap(new Date(2026, 5, 1), 'MMMM')}</Text>
        </View>
        <View style={styles.artTile}>
          <Text style={styles.artTileLabel}>{t('auth.welcome.art.mostly')}</Text>
          <View style={styles.artTileFace}>
            <MoodFace mood={4} size={22} />
            <Text style={styles.artTileValueSm}>{MOODS[4].label}</Text>
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
  artBurners: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  artBurner: {
    width: '48%',
    flexGrow: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.s12,
    gap: spacing.sm,
  },
  artBurnerDimmed: {
    opacity: 0.7,
  },
  artBurnerIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artBurnerLabel: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
  },
  artBurnerTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
  },
  artBurnerFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  artBurnerNote: {
    ...type.caption,
    fontSize: 10,
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

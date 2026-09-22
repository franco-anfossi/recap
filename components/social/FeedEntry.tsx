import { BurnerTag } from '@/components/burners';
import { MoodFace } from '@/components/mood';
import { Avatar } from '@/components/ui';
import { isBurner } from '@/constants/burners';
import { getMoodInfo, toMoodLevel } from '@/constants/moods';
import { colors, fonts, radius, shadows, spacing, type } from '@/constants/theme';
import { fmt } from '@/lib/dates';
import { t } from '@/lib/i18n';
import { useAuthStore } from '@/stores';
import { Entry, Profile, Reaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { isToday, isYesterday, parseISO } from 'date-fns';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

interface FeedEntryProps {
  entry: Entry & { profiles: Profile; entry_reactions?: Reaction[] };
  onReact?: (emoji: string | null) => void;
}

const REACTION_EMOJIS = ['❤️', '🙌', '🔥', '😂', '😮', '😢'];

function relativeDay(date: Date) {
  if (isToday(date)) return t('common.time.today');
  if (isYesterday(date)) return t('common.time.yesterday');
  return fmt(date, 'MMM d');
}

export function FeedEntry({ entry, onReact }: FeedEntryProps) {
  const { user: currentUser } = useAuthStore();
  const { mood, note, profiles: user, entry_date, user_id, entry_reactions = [] } = entry;
  const burners = (entry.burners || []).filter(isBurner);

  const [localReactions, setLocalReactions] = React.useState<Reaction[]>(entry_reactions);
  const [showPicker, setShowPicker] = React.useState(false);

  React.useEffect(() => {
    setLocalReactions(entry_reactions);
  }, [entry_reactions]);

  const isSelf = currentUser?.id === user_id;
  const myReaction = localReactions.find((r) => r.user_id === currentUser?.id)?.emoji || null;

  const reactionCounts: Record<string, number> = {};
  localReactions.forEach((r) => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });
  const reactionEntries = Object.entries(reactionCounts);

  const level = toMoodLevel(mood);
  const moodInfo = getMoodInfo(level);
  const displayName = isSelf ? t('social.user.you') : user?.display_name || t('social.user.anonymous');

  const handleReact = (emoji: string) => {
    setShowPicker(false);
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isRemoving = myReaction === emoji;

    if (currentUser) {
      setLocalReactions((prev) => {
        const filtered = prev.filter((r) => r.user_id !== currentUser.id);
        if (isRemoving) return filtered;
        return [
          ...filtered,
          {
            id: 'optimistic-' + Date.now(),
            user_id: currentUser.id,
            entry_id: entry.id,
            emoji,
            created_at: new Date().toISOString(),
          },
        ];
      });
    }

    onReact?.(isRemoving ? null : emoji);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={user?.display_name} fallback={user?.email} size={40} tone={isSelf ? 'brand' : 'muted'} />
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.date}>{relativeDay(parseISO(entry_date))}</Text>
        </View>
        <View style={[styles.moodBadge, { backgroundColor: moodInfo.tint }]}>
          <MoodFace mood={level} size={26} />
          <Text style={[styles.moodLabel, { color: moodInfo.ink }]}>{moodInfo.label}</Text>
        </View>
      </View>

      {note ? <Text style={styles.note}>{note}</Text> : null}

      {burners.length > 0 && (
        <View style={styles.burners}>
          {burners.map((b) => (
            <BurnerTag key={b} burner={b} />
          ))}
        </View>
      )}

      {(!isSelf || reactionEntries.length > 0) && (
        <View style={styles.footer}>
          <View style={styles.reactions}>
            {reactionEntries.map(([emoji, count]) => {
              const mine = myReaction === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => !isSelf && handleReact(emoji)}
                  disabled={isSelf}
                  accessibilityRole="button"
                  accessibilityLabel={`${emoji} ${count}`}
                  style={[styles.reaction, mine && styles.reactionMine]}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={[styles.reactionCount, mine && styles.reactionCountMine]}>{count}</Text>
                </Pressable>
              );
            })}
          </View>

          {!isSelf && (
            <View>
              {showPicker && (
                <>
                  <Pressable style={styles.pickerBackdrop} onPress={() => setShowPicker(false)} />
                  <Animated.View entering={ZoomIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.picker}>
                    {REACTION_EMOJIS.map((emoji, i) => (
                      <Animated.View key={emoji} entering={FadeIn.delay(i * 30).duration(150)}>
                        <Pressable
                          onPress={() => handleReact(emoji)}
                          accessibilityRole="button"
                          accessibilityLabel={t('social.reactions.reactWith', { emoji })}
                          style={({ pressed }) => [
                            styles.pickerItem,
                            myReaction === emoji && styles.pickerItemActive,
                            pressed && { transform: [{ scale: 1.2 }] },
                          ]}
                        >
                          <Text style={styles.pickerEmoji}>{emoji}</Text>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </Animated.View>
                </>
              )}
              <Pressable
                onPress={() => setShowPicker((s) => !s)}
                accessibilityRole="button"
                accessibilityLabel={t('social.reactions.add')}
                style={({ pressed }) => [styles.addReaction, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name={myReaction ? 'happy' : 'happy-outline'} size={18} color={myReaction ? colors.brand : colors.inkSecondary} />
                <Text style={[styles.addReactionText, myReaction && { color: colors.brand }]}>{myReaction ? t('social.reactions.reacted') : t('social.reactions.react')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.md,
    gap: spacing.s12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.headline,
  },
  date: {
    ...type.caption,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.s12,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  moodLabel: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
  },
  note: {
    fontFamily: fonts.displayItalic,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
  },
  burners: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 32,
  },
  reactions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionMine: {
    backgroundColor: colors.brandTint,
    borderColor: colors.brandSoft,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontFamily: fonts.sansSemibold,
    fontSize: 12,
    color: colors.inkSecondary,
  },
  reactionCountMine: {
    color: colors.brandDeep,
  },
  addReaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addReactionText: {
    fontFamily: fonts.sansSemibold,
    fontSize: 13,
    color: colors.inkSecondary,
  },
  pickerBackdrop: {
    position: 'absolute',
    top: -600,
    bottom: -600,
    left: -600,
    right: -600,
    zIndex: 5,
  },
  picker: {
    position: 'absolute',
    bottom: 38,
    right: 0,
    flexDirection: 'row',
    gap: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
    ...shadows.lg,
  },
  pickerItem: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemActive: {
    backgroundColor: colors.brandTint,
  },
  pickerEmoji: {
    fontSize: 22,
  },
});

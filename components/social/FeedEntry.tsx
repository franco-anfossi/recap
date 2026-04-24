import { Card } from '@/components/ui';
import { getMoodInfo, toMoodLevel } from '@/constants/moods';
import { colors, spacing, typography } from '@/constants/theme';
import { useAuthStore } from '@/stores';
import { Entry, Profile, Reaction } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FeedEntryProps {
  entry: Entry & { profiles: Profile; entry_reactions?: Reaction[] };
  onReact?: (emoji: string | null) => void;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🙌', '👏', '🔥', '🎉'];

export function FeedEntry({ entry, onReact }: FeedEntryProps) {
  const { user: currentUser } = useAuthStore();
  const { mood, note, profiles: user, entry_date, user_id, entry_reactions = [] } = entry;

  // Local state for optimistic updates
  const [localReactions, setLocalReactions] = React.useState<Reaction[]>(entry_reactions);
  const [showPicker, setShowPicker] = React.useState(false);

  React.useEffect(() => {
    setLocalReactions(entry_reactions);
  }, [entry_reactions]);

  const isSelf = currentUser?.id === user_id;

  // Find my reaction in local state
  const myReactionEntry = localReactions.find(r => r.user_id === currentUser?.id);
  const myReaction = myReactionEntry?.emoji || null;

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  localReactions.forEach(r => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  const moodInfo = getMoodInfo(toMoodLevel(mood));
  const formattedDate = format(parseISO(entry_date), 'MMM d');

  // Safety check if user profile is missing (e.g. RLS or join issue)
  const displayName = user?.display_name || 'Anonymous';
  const initial = (user?.display_name?.[0] || user?.email?.[0] || '?').toUpperCase();

  const handleReact = (emoji: string) => {
    setShowPicker(false);

    const isRemoving = myReaction === emoji;

    // Optimistic Update
    if (currentUser) {
      setLocalReactions(prev => {
        // Always remove existing reaction from this user first
        const filtered = prev.filter(r => r.user_id !== currentUser.id);

        if (isRemoving) {
          return filtered; // Just remove
        } else {
          // Add new reaction
          const newReaction: Reaction = {
            id: 'optimistic-' + Date.now(),
            user_id: currentUser.id,
            entry_id: entry.id,
            emoji: emoji,
            created_at: new Date().toISOString()
          };
          return [...filtered, newReaction];
        }
      });
    }

    onReact?.(isRemoving ? null : emoji);
  };

  return (
    <Card style={styles.container} padding="md">
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initial}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>
        <View style={[styles.moodBadge, { backgroundColor: moodInfo.color }]}>
          <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
        </View>
      </View>

      {note && (
        <Text style={styles.note}>{note}</Text>
      )}

      {/* Reaction Action Section */}
      {(!isSelf || Object.keys(reactionCounts).length > 0) && (
        <View style={styles.footer}>

          {/* Left: Add Button & Floating Bubble (Only for others) */}
          <View style={styles.leftAction}>
            {!isSelf && (
              <>
                {/* Floating Bubble Picker */}
                {showPicker && (
                  <>
                    {/* Card-level overlay to catch taps outside the bubble */}
                    <TouchableOpacity
                      style={styles.cardOverlay}
                      activeOpacity={1}
                      onPress={() => setShowPicker(false)}
                    />
                    <View style={styles.floatingBubble}>
                      {REACTION_EMOJIS.map(emoji => (
                        <TouchableOpacity
                          key={emoji}
                          style={[styles.bubbleEmoji, myReaction === emoji && styles.bubbleEmojiActive]}
                          onPress={() => handleReact(emoji)}
                        >
                          <Text style={styles.bubbleEmojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowPicker(!showPicker)}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Right: Existing Reaction Groups */}
          {Object.keys(reactionCounts).length > 0 && (
            <View style={styles.rightReactions}>
              {Object.entries(reactionCounts).map(([emoji, count]) => {
                const isActiveGroup = myReaction === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.miniReaction, isActiveGroup && styles.miniReactionActive]}
                    onPress={() => !isSelf && handleReact(emoji)}
                    disabled={isSelf}
                  >
                    <Text style={[styles.miniReactionEmoji, isActiveGroup && styles.miniReactionEmojiActive]}>
                      {emoji} {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: 'bold',
    color: colors.gray[600],
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  date: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  moodBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  note: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  leftAction: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  addButton: {
    padding: spacing.xs,
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.text.secondary,
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  footerTextDisabled: {
    color: colors.gray[400],
  },
  reactionButtonDisabled: {
    opacity: 0.7,
  },
  reactionsList: {
    // Legacy list style (removed usage but keeping for safety if referenced elsewhere, though we replaced it)
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  miniReaction: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniReactionActive: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  miniReactionEmoji: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  miniReactionEmojiActive: {
    color: colors.primary[900],
    fontWeight: '700',
  },
  reactionCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  // Floating Bubble Styles
  floatingBubble: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    backgroundColor: '#FFF3E0', // Light Orange
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FFE0B2', // Slightly darker orange border
  },
  cardOverlay: {
    position: 'absolute',
    top: -500, // extend far up
    bottom: -500, // extend far down
    left: -100,
    right: -100,
    zIndex: 900,
    backgroundColor: 'transparent',
  },
  bubbleEmoji: {
    padding: 6,
    borderRadius: 20,
  },
  bubbleEmojiActive: {
    backgroundColor: '#FFE0B2', // Orange highlight
  },
  bubbleEmojiText: {
    fontSize: 24,
  },
});

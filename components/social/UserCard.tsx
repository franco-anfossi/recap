import { Avatar, Button } from '@/components/ui';
import { colors, spacing, type } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { Profile } from '@/types';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface UserCardProps {
  user: Profile;
  isFollowing?: boolean; // undefined hides the follow button (e.g. self)
  onFollow?: () => void;
  onUnfollow?: () => void;
  onPress?: () => void;
  last?: boolean;
}

export function UserCard({ user, isFollowing, onFollow, onUnfollow, onPress, last = false }: UserCardProps) {
  const handleAction = () => {
    if (isFollowing) onUnfollow?.();
    else onFollow?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Avatar name={user.display_name} fallback={user.email} size={44} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.display_name || t('social.user.anonymous')}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      {isFollowing !== undefined && (
        <Button
          title={isFollowing ? t('social.user.following') : t('social.user.follow')}
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          onPress={handleAction}
          icon={isFollowing ? 'checkmark' : undefined}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s12,
    backgroundColor: colors.surface,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.headline,
  },
  email: {
    ...type.footnote,
  },
});

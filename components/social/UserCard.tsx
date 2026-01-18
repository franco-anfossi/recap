import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/theme';
import { Profile } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserCardProps {
  user: Profile;
  isFollowing?: boolean; // If null/undefined, don't show follow button (e.g. self)
  onFollow?: () => void;
  onUnfollow?: () => void;
  onPress?: () => void;
}

export function UserCard({ user, isFollowing, onFollow, onUnfollow, onPress }: UserCardProps) {
  const handleAction = () => {
    if (isFollowing) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{user.display_name || 'User'}</Text>
        <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
      </View>

      {isFollowing !== undefined && (
        <Button
          title={isFollowing ? 'Following' : 'Follow'}
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          onPress={handleAction}
          style={styles.button}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  email: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  button: {
    minWidth: 90,
  },
});

import { FeedEntry, UserCard } from '@/components/social';
import { EmptyState, Screen, ScreenHeader } from '@/components/ui';
import { colors, fonts, radius, spacing, type } from '@/constants/theme';
import { useAuthStore, useSocialStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SocialScreen() {
  const {
    feed,
    following,
    searchResults,
    isLoading,
    isSearching,
    fetchFeed,
    fetchFollowing,
    searchUsers,
    clearSearchResults,
    followUser,
    unfollowUser,
    reactToEntry,
  } = useSocialStore();

  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'feed' | 'search'>('feed');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchFeed().finally(() => setHasLoadedOnce(true));
  }, [fetchFeed]);

  useEffect(() => {
    if (currentUser?.id) fetchFollowing(currentUser.id);
  }, [currentUser?.id, fetchFollowing]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length > 2) {
      const timer = setTimeout(() => searchUsers(query), 400);
      return () => clearTimeout(timer);
    }
    clearSearchResults();
  }, [clearSearchResults, searchQuery, searchUsers]);

  const openSearch = () => {
    setMode('search');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const closeSearch = () => {
    setSearchQuery('');
    setMode('feed');
    inputRef.current?.blur();
  };

  const refreshFollowing = async () => {
    if (currentUser?.id) await fetchFollowing(currentUser.id);
  };

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId);
      await refreshFollowing();
      fetchFeed();
    } catch (error: any) {
      Alert.alert('Could not follow', error.message || 'Please try again.');
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId);
      await refreshFollowing();
      fetchFeed();
    } catch (error: any) {
      Alert.alert('Could not unfollow', error.message || 'Please try again.');
    }
  };

  const showInitialLoading = isLoading && !hasLoadedOnce && feed.length === 0;

  return (
    <Screen
      refreshControl={
        mode === 'feed' ? (
          <RefreshControl refreshing={isLoading && hasLoadedOnce} onRefresh={fetchFeed} tintColor={colors.brand} />
        ) : undefined
      }
    >
      <ScreenHeader eyebrow="Friends" title={mode === 'search' ? 'Find people' : 'Feed'} />

      <View style={styles.searchRow}>
        <View style={[styles.search, mode === 'search' && styles.searchActive]}>
          <Ionicons name="search" size={18} color={mode === 'search' ? colors.brand : colors.inkMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search by name or email"
            placeholderTextColor={colors.inkMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={openSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={colors.brand}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>
        {mode === 'search' && (
          <Pressable onPress={closeSearch} hitSlop={8} accessibilityRole="button">
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        )}
      </View>

      {mode === 'search' ? (
        <View style={styles.results}>
          {searchQuery.trim().length <= 2 ? (
            <View style={styles.hint}>
              <Text style={styles.hintText}>Type at least 3 characters to search.</Text>
              {following.length > 0 && (
                <>
                  <Text style={styles.followingTitle}>Following</Text>
                  <View style={styles.list}>
                    {following.map((u, i) => (
                      <UserCard
                        key={u.id}
                        user={u}
                        isFollowing
                        onUnfollow={() => handleUnfollow(u.id)}
                        last={i === following.length - 1}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : isSearching ? (
            <ActivityIndicator color={colors.brand} style={styles.spinner} />
          ) : searchResults.length === 0 ? (
            <EmptyState icon="person-outline" title="No one found" message="Try their name or the email they signed up with." />
          ) : (
            <View style={styles.list}>
              {searchResults.map((u, i) => (
                <UserCard
                  key={u.id}
                  user={u}
                  isFollowing={following.some((f) => f.id === u.id)}
                  onFollow={() => handleFollow(u.id)}
                  onUnfollow={() => handleUnfollow(u.id)}
                  last={i === searchResults.length - 1}
                />
              ))}
            </View>
          )}
        </View>
      ) : showInitialLoading ? (
        <ActivityIndicator color={colors.brand} style={styles.spinner} />
      ) : feed.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Your feed is quiet"
          message="Follow a few friends to see their daily recaps here. Public entries show up too."
          action={{ label: 'Find friends', onPress: openSearch }}
          style={styles.empty}
        />
      ) : (
        <View style={styles.feed}>
          {feed.map((entry) => (
            <FeedEntry key={entry.id} entry={entry} onReact={(emoji) => reactToEntry(entry.id, emoji)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    marginBottom: spacing.md,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchActive: {
    borderColor: colors.brand,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    height: '100%',
  },
  cancel: {
    ...type.callout,
    color: colors.brandStrong,
  },
  results: {
    gap: spacing.md,
  },
  hint: {
    gap: spacing.md,
  },
  hintText: {
    ...type.footnote,
    color: colors.inkMuted,
  },
  followingTitle: {
    ...type.label,
    marginTop: spacing.sm,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  spinner: {
    marginTop: spacing.xxl,
  },
  empty: {
    marginTop: spacing.xl,
  },
  feed: {
    gap: spacing.s12,
  },
});

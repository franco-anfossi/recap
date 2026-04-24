import { FeedEntry, UserCard } from '@/components/social';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useAuthStore, useSocialStore } from '@/stores';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    reactToEntry
  } = useSocialStore();

  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'search'>('feed');

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchFollowing(currentUser.id);
    }
  }, [currentUser?.id, fetchFollowing]);

  // Debounce search
  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length > 2) {
      const timer = setTimeout(() => {
        searchUsers(query);
      }, 500);
      return () => clearTimeout(timer);
    }

    clearSearchResults();
  }, [clearSearchResults, searchQuery, searchUsers]);

  const handleSearchFocus = () => {
    setActiveTab('search');
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    setActiveTab('feed');
  };

  const refreshFollowing = async () => {
    if (currentUser?.id) {
      await fetchFollowing(currentUser.id);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId);
      await refreshFollowing();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to follow user');
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId);
      await refreshFollowing();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unfollow user');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={handleSearchFocus}
        />
        {activeTab === 'search' && (
          <TouchableOpacity onPress={handleCancelSearch}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchFeed} />
        }
      >
        {activeTab === 'search' ? (
          <View>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {isSearching ? (
              <Text style={styles.loadingText}>Searching...</Text>
            ) : searchResults.length === 0 && searchQuery.length > 2 ? (
              <Text style={styles.emptyText}>No users found.</Text>
            ) : (
              searchResults.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFollowing={following.some((followedUser) => followedUser.id === user.id)}
                  onFollow={() => handleFollow(user.id)}
                  onUnfollow={() => handleUnfollow(user.id)}
                />
              ))
            )}
          </View>
        ) : (
          <View>
            {feed.length === 0 && !isLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Your feed is empty.</Text>
                <Text style={styles.emptySubtext}>Follow friends to see their daily recaps!</Text>
                <TouchableOpacity onPress={() => setActiveTab('search')}>
                  <Text style={styles.linkText}>Find friends</Text>
                </TouchableOpacity>
              </View>
            ) : (
              feed.map(entry => (
                <FeedEntry
                  key={entry.id}
                  entry={entry}
                  onReact={(emoji) => reactToEntry(entry.id, emoji)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  searchInput: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.md,
  },
  cancelText: {
    color: colors.primary[600],
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary[600],
    fontWeight: '600',
    fontSize: typography.sizes.md,
  },
});

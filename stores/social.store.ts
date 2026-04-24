import * as api from '@/lib/api/social';
import { Entry, Profile, Reaction, SocialStats } from '@/types';
import { create } from 'zustand';

interface SocialState {
  feed: (Entry & { profiles: Profile; entry_reactions?: Reaction[] })[];
  followers: Profile[];
  following: Profile[];
  stats: SocialStats;
  searchResults: Profile[];

  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  fetchFeed: () => Promise<void>;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  resetSocial: () => void;

  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  reactToEntry: (entryId: string, emoji: string | null) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  feed: [],
  followers: [],
  following: [],
  stats: { followersCount: 0, followingCount: 0, friendsCount: 0, isFollowing: false },
  searchResults: [],

  isLoading: false,
  isSearching: false,
  error: null,

  fetchFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const feed = await api.getFeed();
      set({ feed });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFollowers: async (userId: string) => {
    try {
      const followers = await api.getFollowers(userId);
      set({ followers });
    } catch (error: any) {
      console.error('Error fetching followers:', error);
    }
  },

  fetchFollowing: async (userId: string) => {
    try {
      const following = await api.getFollowing(userId);
      set({ following });
    } catch (error: any) {
      console.error('Error fetching following:', error);
    }
  },

  fetchStats: async (userId: string) => {
    try {
      const stats = await api.getSocialStats(userId);
      set({ stats });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }

    set({ isSearching: true, error: null });
    try {
      const results = await api.searchUsers(query);
      set({ searchResults: results });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearchResults: () => set({ searchResults: [], isSearching: false }),
  resetSocial: () => set({
    feed: [],
    followers: [],
    following: [],
    stats: { followersCount: 0, followingCount: 0, friendsCount: 0, isFollowing: false },
    searchResults: [],
    isLoading: false,
    isSearching: false,
    error: null,
  }),

  followUser: async (userId: string) => {
    try {
      const didFollow = await api.followUser(userId);
      const currentStats = get().stats;
      set({
        stats: {
          ...currentStats,
          isFollowing: true,
          followingCount: didFollow ? currentStats.followingCount + 1 : currentStats.followingCount,
        }
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      const didUnfollow = await api.unfollowUser(userId);
      const currentStats = get().stats;
      set({
        stats: {
          ...currentStats,
          isFollowing: false,
          followingCount: didUnfollow
            ? Math.max(0, currentStats.followingCount - 1)
            : currentStats.followingCount,
        }
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reactToEntry: async (entryId: string, emoji: string | null) => {
    try {
      await api.reactToEntry(entryId, emoji);
      await get().fetchFeed();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  }
}));

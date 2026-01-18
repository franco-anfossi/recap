import * as api from '@/lib/api/social';
import { Entry, Profile, SocialStats } from '@/types';
import { create } from 'zustand';

interface SocialState {
  feed: (Entry & { profiles: Profile })[];
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

  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  reactToEntry: (entryId: string, emoji: string) => Promise<void>;
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

  followUser: async (userId: string) => {
    try {
      await api.followUser(userId);
      // Update stats optimistically if viewing that user
      const currentStats = get().stats;
      set({
        stats: { ...currentStats, isFollowing: true, followersCount: currentStats.followersCount + 1 }
      });
      // Optionally refresh lists
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      await api.unfollowUser(userId);
      const currentStats = get().stats;
      set({
        stats: { ...currentStats, isFollowing: false, followersCount: Math.max(0, currentStats.followersCount - 1) }
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reactToEntry: async (entryId: string, emoji: string) => {
    try {
      await api.reactToEntry(entryId, emoji);
      // For MVP, we won't optimistically update reaction counts in the feed 
      // as it requires more complex state structure (reactions map).
      // We could re-fetch feed or just notify success.
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  }
}));

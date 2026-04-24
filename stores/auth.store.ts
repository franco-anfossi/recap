import * as authApi from '@/lib/api/auth';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEntriesStore } from './entries.store';
import { useGoalsStore } from './goals.store';
import { useSocialStore } from './social.store';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      signIn: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.signIn({ email: email.trim(), password });
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: !!user, isLoading: false });
          return user;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email, password, displayName) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.signUp({
            email: email.trim(),
            password,
            display_name: displayName?.trim() || undefined,
          });
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: !!user, isLoading: false });
          return user;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await authApi.signOut();
          useEntriesStore.getState().resetEntries();
          useGoalsStore.getState().resetGoals();
          useSocialStore.getState().resetSocial();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: !!user, isLoading: false });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

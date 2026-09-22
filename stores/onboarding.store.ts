import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingState {
  /** Persisted: the intro slides were shown on this device. */
  hasSeenWelcome: boolean;
  /** Persisted: user ids that completed the post-signup setup on this device. */
  completedSetup: Record<string, true>;
  /** Persisted: the account that just signed up and still has to run setup. */
  pendingSetupUserId: string | null;
  hasHydrated: boolean;

  markWelcomeSeen: () => void;
  startSetup: (userId: string) => void;
  completeSetup: (userId: string) => void;
  needsSetup: (userId: string | undefined) => boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasSeenWelcome: false,
      completedSetup: {},
      pendingSetupUserId: null,
      hasHydrated: false,

      markWelcomeSeen: () => set({ hasSeenWelcome: true }),
      startSetup: (userId) => set({ pendingSetupUserId: userId }),
      completeSetup: (userId) =>
        set((state) => ({
          pendingSetupUserId: state.pendingSetupUserId === userId ? null : state.pendingSetupUserId,
          completedSetup: { ...state.completedSetup, [userId]: true },
        })),
      needsSetup: (userId) => {
        if (!userId) return false;
        const { pendingSetupUserId, completedSetup } = get();
        return pendingSetupUserId === userId && !completedSetup[userId];
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenWelcome: state.hasSeenWelcome,
        completedSetup: state.completedSetup,
        pendingSetupUserId: state.pendingSetupUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

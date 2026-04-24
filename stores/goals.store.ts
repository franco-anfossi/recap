import * as api from '@/lib/api/goals';
import { CreateGoalInput, UpdateGoalInput, YearlyGoal } from '@/types';
import { create } from 'zustand';

interface GoalsState {
  goals: YearlyGoal[];
  isLoading: boolean;
  error: string | null;

  fetchGoals: (year: number) => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<void>;
  updateGoal: (id: string, input: UpdateGoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  toggleCompletion: (id: string, isCompleted: boolean) => Promise<void>;
  resetGoals: () => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  resetGoals: () => set({ goals: [], isLoading: false, error: null }),

  fetchGoals: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const goals = await api.getGoalsByYear(year);
      set({ goals });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createGoal: async (input: CreateGoalInput) => {
    set({ isLoading: true, error: null });
    try {
      const newGoal = await api.createGoal(input);
      set((state) => ({ goals: [...state.goals, newGoal] }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateGoal: async (id: string, input: UpdateGoalInput) => {
    set({ isLoading: true, error: null });
    try {
      const updatedGoal = await api.updateGoal(id, input);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteGoal: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleCompletion: async (id: string, isCompleted: boolean) => {
    // Optimistic update
    set((state) => ({
      goals: state.goals.map((g) =>
        g.id === id ? { ...g, is_completed: isCompleted } : g
      ),
    }));

    try {
      await api.toggleGoalCompletion(id, isCompleted);
    } catch (error: any) {
      // Revert on error
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, is_completed: !isCompleted } : g
        ),
        error: error.message,
      }));
    }
  },
}));

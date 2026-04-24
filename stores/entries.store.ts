import * as entriesApi from '@/lib/api/entries';
import { CreateEntryInput, Entry } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

function mergeEntry(entries: Entry[], entry: Entry): Entry[] {
  const nextEntries = entries.filter((existing) => existing.id !== entry.id);
  return [entry, ...nextEntries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
}

function mergeEntries(existingEntries: Entry[], incomingEntries: Entry[]): Entry[] {
  const entriesByDate = new Map(existingEntries.map((entry) => [entry.entry_date, entry]));

  incomingEntries.forEach((entry) => {
    entriesByDate.set(entry.entry_date, entry);
  });

  return Array.from(entriesByDate.values()).sort((a, b) =>
    b.entry_date.localeCompare(a.entry_date)
  );
}

interface EntriesState {
  entries: Entry[];
  todayEntry: Entry | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: string; // For calendar navigation

  // Actions
  setEntries: (entries: Entry[]) => void;
  setTodayEntry: (entry: Entry | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedDate: (date: string) => void;
  resetEntries: () => void;

  // API Actions
  fetchTodayEntry: () => Promise<Entry | null>;
  fetchEntryById: (id: string) => Promise<Entry | null>;
  fetchEntriesByYear: (year: number) => Promise<void>;
  fetchEntriesByMonth: (year: number, month: number) => Promise<void>;
  fetchEntriesByDateRange: (startDate: string, endDate: string) => Promise<void>;
  createOrUpdateEntry: (input: CreateEntryInput) => Promise<Entry>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryByDate: (date: string) => Entry | undefined;
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
      entries: [],
      todayEntry: null,
      isLoading: false,
      error: null,
      selectedDate: format(new Date(), 'yyyy-MM-dd'),

      setEntries: (entries) => set({ entries }),
      setTodayEntry: (todayEntry) => set({ todayEntry }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      resetEntries: () => set({
        entries: [],
        todayEntry: null,
        isLoading: false,
        error: null,
        selectedDate: format(new Date(), 'yyyy-MM-dd'),
      }),

      fetchTodayEntry: async () => {
        set({ isLoading: true, error: null });
        try {
          const entry = await entriesApi.getTodayEntry();
          set({ todayEntry: entry, isLoading: false });
          return entry;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      fetchEntryById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const entry = await entriesApi.getEntryById(id);
          const today = format(new Date(), 'yyyy-MM-dd');

          set((state) => ({
            entries: entry ? mergeEntry(state.entries, entry) : state.entries,
            todayEntry: entry?.entry_date === today ? entry : state.todayEntry,
            isLoading: false,
          }));

          return entry;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      fetchEntriesByYear: async (year) => {
        set({ isLoading: true, error: null });
        try {
          const entries = await entriesApi.getEntriesByYear(year);
          set({ entries, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchEntriesByMonth: async (year, month) => {
        set({ isLoading: true, error: null });
        try {
          const entries = await entriesApi.getEntriesByMonth(year, month);

          set({
            entries: mergeEntries(get().entries, entries),
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchEntriesByDateRange: async (startDate, endDate) => {
        set({ isLoading: true, error: null });
        try {
          const entries = await entriesApi.getEntriesByDateRange(startDate, endDate);
          set({
            entries: mergeEntries(get().entries, entries),
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      createOrUpdateEntry: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const entry = await entriesApi.upsertEntry(input);

          // Update entries list
          const entries = get().entries;
          const existingIndex = entries.findIndex((e) => e.entry_date === entry.entry_date);

          if (existingIndex >= 0) {
            entries[existingIndex] = entry;
            set({ entries: [...entries] });
          } else {
            set({ entries: [entry, ...entries] });
          }

          // Update today's entry if applicable
          const today = format(new Date(), 'yyyy-MM-dd');
          if (entry.entry_date === today) {
            set({ todayEntry: entry });
          }

          set({ isLoading: false });
          return entry;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      deleteEntry: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await entriesApi.deleteEntry(id);
          const entries = get().entries.filter((e) => e.id !== id);
          set({ entries, isLoading: false });

          // Clear today's entry if deleted
          if (get().todayEntry?.id === id) {
            set({ todayEntry: null });
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      getEntryByDate: (date) => {
        return get().entries.find((e) => e.entry_date === date);
      },
    }),
    {
      name: 'entries-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        todayEntry: state.todayEntry,
      }),
    }
  )
);

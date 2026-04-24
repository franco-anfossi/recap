import { CreateEntryInput, Entry, UpdateEntryInput } from '@/types';
import { format, isFuture, isValid, parseISO } from 'date-fns';
import { supabase } from '../supabase';

function assertSaveableEntryDate(entryDate: string): void {
  const parsedDate = parseISO(entryDate);

  if (!isValid(parsedDate)) {
    throw new Error('Invalid entry date');
  }
  if (isFuture(parsedDate)) {
    throw new Error('Cannot save future entries');
  }
}

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('Not authenticated');

  return user.id;
}

export async function getTodayEntry(): Promise<Entry | null> {
  const userId = await getCurrentUserId();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', today)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getEntryByDate(date: string): Promise<Entry | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getEntryById(id: string): Promise<Entry | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getEntriesByYear(year: number): Promise<Entry[]> {
  const userId = await getCurrentUserId();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getEntriesByMonth(year: number, month: number): Promise<Entry[]> {
  const userId = await getCurrentUserId();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getEntriesByDateRange(startDate: string, endDate: string): Promise<Entry[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createEntry(input: CreateEntryInput): Promise<Entry> {
  assertSaveableEntryDate(input.entry_date);
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('entries')
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEntry(id: string, input: UpdateEntryInput): Promise<Entry> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('entries')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertEntry(input: CreateEntryInput): Promise<Entry> {
  assertSaveableEntryDate(input.entry_date);
  const userId = await getCurrentUserId();

  // This handles the "one entry per day" constraint gracefully
  const { data, error } = await supabase
    .from('entries')
    .upsert({ ...input, user_id: userId }, {
      onConflict: 'user_id,entry_date',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEntry(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getEntryStats(year: number) {
  const entries = await getEntriesByYear(year);

  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageMood: 0,
      moodDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      monthlyAverages: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        average: 0,
        count: 0,
      })),
    };
  }

  const moodSum = entries.reduce((sum, e) => sum + e.mood, 0);
  const averageMood = moodSum / entries.length;

  const moodDistribution = entries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Calculate monthly averages
  const monthlyData: Record<number, { sum: number; count: number }> = {};
  entries.forEach((e) => {
    const month = Number(e.entry_date.split('-')[1]);
    if (!monthlyData[month]) {
      monthlyData[month] = { sum: 0, count: 0 };
    }
    monthlyData[month].sum += e.mood;
    monthlyData[month].count += 1;
  });

  const monthlyAverages = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const data = monthlyData[month];

    return {
      month,
      average: data ? data.sum / data.count : 0,
      count: data?.count || 0,
    };
  });

  return {
    totalEntries: entries.length,
    averageMood,
    moodDistribution,
    monthlyAverages,
  };
}

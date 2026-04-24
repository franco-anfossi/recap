import { CreateGoalInput, UpdateGoalInput, YearlyGoal } from '@/types';
import { supabase } from '../supabase';

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('User not authenticated');

  return user.id;
}

async function assertOwnEntryAndGoal(entryId: string, goalId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const [entryResult, goalResult] = await Promise.all([
    supabase
      .from('entries')
      .select('id')
      .eq('id', entryId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('yearly_goals')
      .select('id')
      .eq('id', goalId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (entryResult.error) throw entryResult.error;
  if (goalResult.error) throw goalResult.error;
  if (!entryResult.data || !goalResult.data) {
    throw new Error('Entry or goal not found');
  }
}

export async function getGoalsByYear(year: number): Promise<YearlyGoal[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('yearly_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createGoal(input: CreateGoalInput): Promise<YearlyGoal> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('yearly_goals')
    .insert({
      ...input,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<YearlyGoal> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('yearly_goals')
    .update(input)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from('yearly_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function toggleGoalCompletion(id: string, isCompleted: boolean): Promise<YearlyGoal> {
  return updateGoal(id, { is_completed: isCompleted });
}

// Link/Unlink goals to entries
export async function linkGoalToEntry(entryId: string, goalId: string) {
  await assertOwnEntryAndGoal(entryId, goalId);

  const { error } = await supabase
    .from('entry_goals')
    .insert({ entry_id: entryId, goal_id: goalId });

  if (error) throw error;
}

export async function unlinkGoalFromEntry(entryId: string, goalId: string) {
  await assertOwnEntryAndGoal(entryId, goalId);

  const { error } = await supabase
    .from('entry_goals')
    .delete()
    .match({ entry_id: entryId, goal_id: goalId });

  if (error) throw error;
}

export async function getGoalsForEntry(entryId: string): Promise<string[]> {
  const userId = await getCurrentUserId();

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (entryError) throw entryError;
  if (!entry) return [];

  const { data, error } = await supabase
    .from('entry_goals')
    .select('goal_id')
    .eq('entry_id', entryId);

  if (error) throw error;

  const goalIds = data.map(d => d.goal_id);
  if (goalIds.length === 0) return [];

  const { data: goals, error: goalsError } = await supabase
    .from('yearly_goals')
    .select('id')
    .eq('user_id', userId)
    .in('id', goalIds);

  if (goalsError) throw goalsError;

  const ownedGoalIds = new Set((goals || []).map((goal) => goal.id));
  return goalIds.filter((goalId) => ownedGoalIds.has(goalId));
}

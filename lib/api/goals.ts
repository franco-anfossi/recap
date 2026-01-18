import { CreateGoalInput, UpdateGoalInput, YearlyGoal } from '@/types';
import { supabase } from '../supabase';

export async function getGoalsByYear(year: number): Promise<YearlyGoal[]> {
  const { data, error } = await supabase
    .from('yearly_goals')
    .select('*')
    .eq('year', year)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createGoal(input: CreateGoalInput): Promise<YearlyGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('yearly_goals')
    .insert({
      ...input,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<YearlyGoal> {
  const { data, error } = await supabase
    .from('yearly_goals')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from('yearly_goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleGoalCompletion(id: string, isCompleted: boolean): Promise<YearlyGoal> {
  return updateGoal(id, { is_completed: isCompleted });
}

// Link/Unlink goals to entries
export async function linkGoalToEntry(entryId: string, goalId: string) {
  const { error } = await supabase
    .from('entry_goals')
    .insert({ entry_id: entryId, goal_id: goalId });

  if (error) throw error;
}

export async function unlinkGoalFromEntry(entryId: string, goalId: string) {
  const { error } = await supabase
    .from('entry_goals')
    .delete()
    .match({ entry_id: entryId, goal_id: goalId });

  if (error) throw error;
}

export async function getGoalsForEntry(entryId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('entry_goals')
    .select('goal_id')
    .eq('entry_id', entryId);

  if (error) throw error;
  return data.map(d => d.goal_id); // Return array of goal IDs
}

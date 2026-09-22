import { Burner } from '@/constants/burners';
import { LoginCredentials, RegisterCredentials, User } from '@/types';
import * as Linking from 'expo-linking';
import { supabase } from '../supabase';

export async function signUp({ email, password, display_name }: RegisterCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
      },
    },
  });

  if (error) throw error;

  // Profile is created automatically by database trigger (on_auth_user_created)
  return data;
}

export async function signIn({ email, password }: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (profile) return profile;

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email || '',
      display_name: user.user_metadata?.display_name || null,
    })
    .select()
    .single();

  if (createError) throw createError;
  return createdProfile;
}

export async function updateProfile(input: { display_name?: string | null; dimmed_burner?: Burner | null }): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Permanently deletes the signed-in account and everything it owns. */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut().catch(() => {});
}

export async function resetPassword(email: string) {
  // The link opens the app on the reset-password screen. Add this URL to the
  // Supabase dashboard's redirect allow-list (Authentication → URL configuration).
  const redirectTo = Linking.createURL('/reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

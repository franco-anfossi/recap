import { Entry, Profile, Reaction, SocialStats } from '@/types';
import { supabase } from '../supabase';

async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error('Not authenticated');

  return user.id;
}

async function assertVisibleEntry(entryId: string): Promise<void> {
  const { data, error } = await supabase
    .from('entries')
    .select('id')
    .eq('id', entryId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Entry not found');
}

// --- Follows ---

export async function followUser(userId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId();
  if (currentUserId === userId) throw new Error('You cannot follow yourself');

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: currentUserId, following_id: userId });

  if (error?.code === '23505') return false;
  if (error) throw error;

  return true;
}

export async function unfollowUser(userId: string): Promise<boolean> {
  const currentUserId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: currentUserId, following_id: userId })
    .select('follower_id');

  if (error) throw error;
  return (data || []).length > 0;
}

function normalizeJoinedProfile(profile: Profile | Profile[] | null): Profile | null {
  if (Array.isArray(profile)) {
    return profile[0] ?? null;
  }
  return profile;
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId);

  if (error) throw error;
  return (data || [])
    .map((row) => normalizeJoinedProfile(row.profiles as Profile | Profile[] | null))
    .filter((profile): profile is Profile => Boolean(profile));
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId);

  if (error) throw error;
  return (data || [])
    .map((row) => normalizeJoinedProfile(row.profiles as Profile | Profile[] | null))
    .filter((profile): profile is Profile => Boolean(profile));
}

export async function getSocialStats(userId: string): Promise<SocialStats> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch lists of IDs to calculate mutual friends
  const [followersData, followingData, isFollowing] = await Promise.all([
    supabase.from('follows').select('follower_id').eq('following_id', userId),
    supabase.from('follows').select('following_id').eq('follower_id', userId),
    currentUser
      ? supabase.from('follows').select('*').match({ follower_id: currentUser.id, following_id: userId }).maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);

  if (followersData.error) throw followersData.error;
  if (followingData.error) throw followingData.error;
  if (isFollowing.error) throw isFollowing.error;

  const followerIds = new Set(followersData.data?.map(f => f.follower_id) || []);
  const followingIds = new Set(followingData.data?.map(f => f.following_id) || []);

  // Calculate mutual friends
  let friendsCount = 0;
  followerIds.forEach(id => {
    if (followingIds.has(id)) {
      friendsCount++;
    }
  });

  return {
    followersCount: followerIds.size,
    followingCount: followingIds.size,
    friendsCount,
    isFollowing: !!isFollowing.data,
  };
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const { data: { user } } = await supabase.auth.getUser();

  const emailQuery = supabase
    .from('profiles')
    .select('*')
    .ilike('email', `%${trimmedQuery}%`)
    .limit(10);

  const nameQuery = supabase
    .from('profiles')
    .select('*')
    .ilike('display_name', `%${trimmedQuery}%`)
    .limit(10);

  if (user) {
    emailQuery.neq('id', user.id);
    nameQuery.neq('id', user.id);
  }

  const [byEmail, byName] = await Promise.all([emailQuery, nameQuery]);

  if (byEmail.error) throw byEmail.error;
  if (byName.error) throw byName.error;

  const results = new Map<string, Profile>();
  [...(byEmail.data || []), ...(byName.data || [])].forEach((profile) => {
    results.set(profile.id, profile);
  });

  return Array.from(results.values()).slice(0, 10);
}

// --- Feed ---

export async function getFeed(): Promise<(Entry & { profiles: Profile; entry_reactions?: Reaction[] })[]> {
  const currentUserId = await getCurrentUserId();

  // Get list of people I follow
  const { data: following, error: followingError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  if (followingError) throw followingError;

  // Also include myself
  const followingIds = new Set((following || []).map(f => f.following_id));
  const userIds = [currentUserId, ...followingIds];

  const [networkEntries, publicEntries] = await Promise.all([
    supabase
      .from('entries')
      .select('*, profiles(*), entry_reactions(*)')
      .in('user_id', userIds)
      .order('entry_date', { ascending: false })
      .limit(20),
    supabase
      .from('entries')
      .select('*, profiles(*), entry_reactions(*)')
      .eq('visibility', 'public')
      .order('entry_date', { ascending: false })
      .limit(20),
  ]);

  if (networkEntries.error) throw networkEntries.error;
  if (publicEntries.error) throw publicEntries.error;

  const entriesById = new Map<string, Entry & { profiles: Profile; entry_reactions?: Reaction[] }>();

  [...(networkEntries.data || []), ...(publicEntries.data || [])].forEach((entry) => {
    if (
      entry.user_id === currentUserId ||
      entry.visibility === 'public' ||
      (entry.visibility === 'friends' && followingIds.has(entry.user_id))
    ) {
      entriesById.set(entry.id, entry as Entry & { profiles: Profile; entry_reactions?: Reaction[] });
    }
  });

  return Array.from(entriesById.values())
    .sort((a, b) => {
      const dateComparison = b.entry_date.localeCompare(a.entry_date);
      if (dateComparison !== 0) return dateComparison;
      return b.created_at.localeCompare(a.created_at);
    })
    .slice(0, 30);
}

// --- Reactions ---

export async function reactToEntry(entryId: string, emoji: string | null): Promise<void> {
  const currentUserId = await getCurrentUserId();

  if (emoji === null) {
    await removeReaction(entryId);
    return;
  }

  await assertVisibleEntry(entryId);

  const { error } = await supabase
    .from('entry_reactions')
    .upsert(
      { user_id: currentUserId, entry_id: entryId, emoji },
      { onConflict: 'user_id,entry_id' }
    );

  if (error) throw error;
}

export async function removeReaction(entryId: string): Promise<void> {
  const currentUserId = await getCurrentUserId();

  const { error } = await supabase
    .from('entry_reactions')
    .delete()
    .match({ user_id: currentUserId, entry_id: entryId });

  if (error) throw error;
}

export async function getReactions(entryId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('entry_reactions')
    .select('*')
    .eq('entry_id', entryId);

  if (error) throw error;
  return data;
}

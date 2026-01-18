import { Entry, Profile, Reaction, SocialStats } from '@/types';
import { supabase } from '../supabase';

// --- Follows ---

export async function followUser(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: userId });

  if (error) throw error;
}

export async function unfollowUser(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: user.id, following_id: userId });

  if (error) throw error;
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId);

  if (error) throw error;
  // @ts-ignore: Supabase typing is tricky with joins
  return data.map(d => d.profiles);
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId);

  if (error) throw error;
  // @ts-ignore
  return data.map(d => d.profiles);
}

export async function getSocialStats(userId: string): Promise<SocialStats> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch lists of IDs to calculate mutual friends
  const [followersData, followingData, isFollowing] = await Promise.all([
    supabase.from('follows').select('follower_id').eq('following_id', userId),
    supabase.from('follows').select('following_id').eq('follower_id', userId),
    currentUser ? supabase.from('follows').select('*').match({ follower_id: currentUser.id, following_id: userId }).single() : Promise.resolve({ data: null, error: null })
  ]);

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
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data;
}

// --- Feed ---

// Complex query for feed:
// 1. Get people I follow
// 2. Get their "friends" or "public" entries
// For MVP, we'll fetch recently updated public/friends entries and filter in application or use a view if needed
export async function getFeed(): Promise<(Entry & { profiles: Profile })[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get list of people I follow
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  // Also include myself
  const userIds = [user.id, ...(following?.map(f => f.following_id) || [])];

  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('entries')
    .select('*, profiles(*), entry_reactions(*)')
    .in('user_id', userIds)
    .order('entry_date', { ascending: false })
    .limit(20);

  if (error) throw error;

  // Filter visibility:
  // - My entries: Always show
  // - Others: Show if public OR (friends AND mutual follow)
  // Since we query by 'following', we likely have access. But strictly 'friends' visibility 
  // implies mutual follow. For MVP simplicity, we'll assume being followed allows seeing 'friends' 
  // visible posts, or we just rely on client filtering.
  // Ideally, RLS handles this securely.

  return data as (Entry & { profiles: Profile })[];
}

// --- Reactions ---

export async function reactToEntry(entryId: string, emoji: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('entry_reactions')
    .upsert(
      { user_id: user.id, entry_id: entryId, emoji },
      { onConflict: 'user_id,entry_id' }
    );

  if (error) throw error;
}

export async function removeReaction(entryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('entry_reactions')
    .delete()
    .match({ user_id: user.id, entry_id: entryId });

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

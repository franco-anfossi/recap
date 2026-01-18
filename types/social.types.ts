export type Visibility = 'private' | 'friends' | 'public';

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Reaction {
  id: string;
  user_id: string;
  entry_id: string;
  emoji: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SocialStats {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isFollowing: boolean;
}

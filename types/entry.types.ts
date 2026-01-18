import { MoodLevel } from '@/constants/moods';
import { Visibility } from './social.types';

export interface Entry {
  id: string;
  user_id: string;
  entry_date: string; // ISO date string YYYY-MM-DD
  mood: number; // 1-5 integer
  note: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  video_duration_seconds: number | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryInput {
  user_id: string;
  entry_date: string;
  mood: number;
  note?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration_seconds?: number;
  visibility?: Visibility;
}

export interface UpdateEntryInput {
  mood?: MoodLevel;
  note?: string;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration_seconds?: number;
  visibility?: Visibility;
}

export interface YearlySummary {
  id: string;
  user_id: string;
  year: number;
  summary_text: string;
  mood_average: number;
  total_entries: number;
  generated_at: string;
}

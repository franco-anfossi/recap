import { Burner } from '@/constants/burners';

export interface YearlyGoal {
  id: string;
  user_id: string;
  year: number;
  title: string;
  description: string | null;
  burner: Burner | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  year: number;
  title: string;
  description?: string;
  burner?: Burner | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  burner?: Burner | null;
  is_completed?: boolean;
}

/** How much an intention has actually moved, derived from tagged check-ins. */
export interface GoalProgress {
  goalId: string;
  /** Distinct days with a check-in tagged to this goal. */
  days: number;
  /** ISO date of the most recent tagged check-in. */
  lastDate: string | null;
  /** Tagged check-ins in the last 7 days. */
  thisWeek: number;
}

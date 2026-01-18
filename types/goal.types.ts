export interface YearlyGoal {
  id: string;
  user_id: string;
  year: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  year: number;
  title: string;
  description?: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  is_completed?: boolean;
}

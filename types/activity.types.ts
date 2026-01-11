export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'verified';
export type ActivityCategory = 'homework' | 'reading' | 'problem-solving' | 'practice' | 'other';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  points_value: number;
  assigned_to?: string;
  created_by?: string;
  status: ActivityStatus;
  due_date?: string;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  category: ActivityCategory;
  points_value: number;
  assigned_to?: string;
  due_date?: string;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  points_value?: number;
  status?: ActivityStatus;
  due_date?: string;
}

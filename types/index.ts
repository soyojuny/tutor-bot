// Database types
export * from './database.types';

// Auth types
export * from './auth.types';

// Activity types
export * from './activity.types';

// Points types
export * from './points.types';

// Reward types
export * from './reward.types';

// Streak types
export interface DailyStreak {
  id: string;
  profile_id: string;
  streak_count: number;
  last_activity_date: string;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

/**
 * 연속 달성일(스트릭) 관련 타입
 */
export interface DailyStreak {
  id: string;
  profile_id: string;
  streak_count: number;
  last_activity_date: string;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

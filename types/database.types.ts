export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: 'parent' | 'child';
          age: number | null;
          avatar_url: string | null;
          pin_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: 'parent' | 'child';
          age?: number | null;
          avatar_url?: string | null;
          pin_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: 'parent' | 'child';
          age?: number | null;
          avatar_url?: string | null;
          pin_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: 'homework' | 'reading' | 'problem-solving' | 'practice' | 'other';
          points_value: number;
          assigned_to: string | null;
          created_by: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'verified';
          due_date: string | null;
          completed_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
          frequency: 'once' | 'weekdays' | 'daily';
          max_daily_count: number;
          is_template: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: 'homework' | 'reading' | 'problem-solving' | 'practice' | 'other';
          points_value?: number;
          assigned_to?: string | null;
          created_by?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'verified';
          due_date?: string | null;
          completed_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
          frequency?: 'once' | 'weekdays' | 'daily';
          max_daily_count?: number;
          is_template?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: 'homework' | 'reading' | 'problem-solving' | 'practice' | 'other';
          points_value?: number;
          assigned_to?: string | null;
          created_by?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'verified';
          due_date?: string | null;
          completed_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
          frequency?: 'once' | 'weekdays' | 'daily';
          max_daily_count?: number;
          is_template?: boolean;
        };
      };
      activity_completions: {
        Row: {
          id: string;
          activity_id: string;
          profile_id: string;
          completed_date: string;
          completed_at: string;
          status: 'completed' | 'verified';
          verified_at: string | null;
          verified_by: string | null;
          metadata: Record<string, unknown>;
          points_awarded: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          profile_id: string;
          completed_date?: string;
          completed_at?: string;
          status?: 'completed' | 'verified';
          verified_at?: string | null;
          verified_by?: string | null;
          metadata?: Record<string, unknown>;
          points_awarded?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          activity_id?: string;
          profile_id?: string;
          completed_date?: string;
          completed_at?: string;
          status?: 'completed' | 'verified';
          verified_at?: string | null;
          verified_by?: string | null;
          metadata?: Record<string, unknown>;
          points_awarded?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          points_cost: number;
          category: 'screen_time' | 'treat' | 'activity' | 'toy' | 'privilege' | 'other' | null;
          icon_emoji: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          points_cost: number;
          category?: 'screen_time' | 'treat' | 'activity' | 'toy' | 'privilege' | 'other' | null;
          icon_emoji?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          points_cost?: number;
          category?: 'screen_time' | 'treat' | 'activity' | 'toy' | 'privilege' | 'other' | null;
          icon_emoji?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      points_ledger: {
        Row: {
          id: string;
          profile_id: string | null;
          activity_id: string | null;
          reward_id: string | null;
          completion_id: string | null;
          points_change: number;
          balance_after: number;
          transaction_type: 'earned' | 'spent' | 'adjusted' | 'bonus';
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          activity_id?: string | null;
          reward_id?: string | null;
          completion_id?: string | null;
          points_change: number;
          balance_after: number;
          transaction_type: 'earned' | 'spent' | 'adjusted' | 'bonus';
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          activity_id?: string | null;
          reward_id?: string | null;
          completion_id?: string | null;
          points_change?: number;
          balance_after?: number;
          transaction_type?: 'earned' | 'spent' | 'adjusted' | 'bonus';
          notes?: string | null;
          created_at?: string;
        };
      };
      reward_redemptions: {
        Row: {
          id: string;
          reward_id: string | null;
          profile_id: string | null;
          points_spent: number;
          status: 'pending' | 'approved' | 'fulfilled' | 'rejected';
          redeemed_at: string;
          fulfilled_at: string | null;
          fulfilled_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          reward_id?: string | null;
          profile_id?: string | null;
          points_spent: number;
          status?: 'pending' | 'approved' | 'fulfilled' | 'rejected';
          redeemed_at?: string;
          fulfilled_at?: string | null;
          fulfilled_by?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          reward_id?: string | null;
          profile_id?: string | null;
          points_spent?: number;
          status?: 'pending' | 'approved' | 'fulfilled' | 'rejected';
          redeemed_at?: string;
          fulfilled_at?: string | null;
          fulfilled_by?: string | null;
          notes?: string | null;
        };
      };
      daily_streaks: {
        Row: {
          id: string;
          profile_id: string | null;
          streak_count: number;
          last_activity_date: string;
          longest_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          streak_count?: number;
          last_activity_date: string;
          longest_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          streak_count?: number;
          last_activity_date?: string;
          longest_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      book_discussions: {
        Row: {
          id: string;
          profile_id: string;
          book_title: string;
          summary: string | null;
          discussed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          book_title: string;
          summary?: string | null;
          discussed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          book_title?: string;
          summary?: string | null;
          discussed_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      profile_points_balance: {
        Row: {
          id: string;
          name: string;
          current_balance: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

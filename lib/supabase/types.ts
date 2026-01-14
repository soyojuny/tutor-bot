/**
 * Supabase 테이블 Row/Insert/Update 타입 헬퍼
 *
 * API 라우트에서 Supabase 쿼리 결과의 타입을 명시적으로 지정할 때 사용합니다.
 * 이 타입들을 사용하면 `as any` 캐스팅 없이 타입 안전성을 확보할 수 있습니다.
 */
import { Database } from '@/types/database.types';

// ============================================
// Profile 테이블
// ============================================
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// ============================================
// Activity 테이블
// ============================================
export type ActivityRow = Database['public']['Tables']['activities']['Row'];
export type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
export type ActivityUpdate = Database['public']['Tables']['activities']['Update'];

// ============================================
// Reward 테이블
// ============================================
export type RewardRow = Database['public']['Tables']['rewards']['Row'];
export type RewardInsert = Database['public']['Tables']['rewards']['Insert'];
export type RewardUpdate = Database['public']['Tables']['rewards']['Update'];

// ============================================
// Points Ledger 테이블
// ============================================
export type PointsLedgerRow = Database['public']['Tables']['points_ledger']['Row'];
export type PointsLedgerInsert = Database['public']['Tables']['points_ledger']['Insert'];
export type PointsLedgerUpdate = Database['public']['Tables']['points_ledger']['Update'];

// ============================================
// Reward Redemptions 테이블
// ============================================
export type RedemptionRow = Database['public']['Tables']['reward_redemptions']['Row'];
export type RedemptionInsert = Database['public']['Tables']['reward_redemptions']['Insert'];
export type RedemptionUpdate = Database['public']['Tables']['reward_redemptions']['Update'];

// ============================================
// Daily Streaks 테이블
// ============================================
export type DailyStreakRow = Database['public']['Tables']['daily_streaks']['Row'];
export type DailyStreakInsert = Database['public']['Tables']['daily_streaks']['Insert'];
export type DailyStreakUpdate = Database['public']['Tables']['daily_streaks']['Update'];

// ============================================
// Views
// ============================================
export type ProfilePointsBalanceRow = Database['public']['Views']['profile_points_balance']['Row'];

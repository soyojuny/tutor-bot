export type RewardCategory = 'screen_time' | 'treat' | 'activity' | 'toy' | 'privilege' | 'other';
export type RedemptionStatus = 'pending' | 'approved' | 'fulfilled' | 'rejected';

export interface Reward {
  id: string;
  title: string;
  description?: string;
  points_cost: number;
  category?: RewardCategory;
  icon_emoji?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRewardInput {
  title: string;
  description?: string;
  points_cost: number;
  category?: RewardCategory;
  icon_emoji?: string;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  profile_id: string;
  points_spent: number;
  status: RedemptionStatus;
  redeemed_at: string;
  fulfilled_at?: string;
  fulfilled_by?: string;
  notes?: string;
}

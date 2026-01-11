export type TransactionType = 'earned' | 'spent' | 'adjusted' | 'bonus';

export interface PointsTransaction {
  id: string;
  profile_id: string;
  activity_id?: string;
  reward_id?: string;
  points_change: number;
  balance_after: number;
  transaction_type: TransactionType;
  notes?: string;
  created_at: string;
}

export interface PointsBalance {
  profile_id: string;
  current_balance: number;
}

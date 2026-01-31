import { PointsLedgerRow, SupabaseQueryResult } from '@/lib/supabase/types';

/**
 * 프로필의 현재 포인트 잔액 조회
 * points_ledger에서 가장 최근 레코드의 balance_after를 반환합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCurrentBalance(supabase: any, profileId: string): Promise<number> {
  const { data: latestTransaction }: SupabaseQueryResult<PointsLedgerRow> = await supabase
    .from('points_ledger')
    .select('balance_after')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return latestTransaction?.balance_after ?? 0;
}

/**
 * 포인트 원장에 거래 기록 추가
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addPointsTransaction(supabase: any, params: {
  profileId: string;
  pointsChange: number;
  balanceAfter: number;
  transactionType: 'earned' | 'spent' | 'adjusted' | 'bonus';
  notes: string;
  completionId?: string;
  rewardId?: string;
}): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('points_ledger')
    .insert({
      profile_id: params.profileId,
      completion_id: params.completionId ?? null,
      reward_id: params.rewardId ?? null,
      points_change: params.pointsChange,
      balance_after: params.balanceAfter,
      transaction_type: params.transactionType,
      notes: params.notes,
    });

  return { error };
}

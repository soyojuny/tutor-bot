import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleApiError } from '@/lib/api/helpers';
import { PointsLedgerRow, SupabaseQueryResult } from '@/lib/supabase/types';

/**
 * GET /api/points?profile_id=xxx
 * 프로필의 포인트 잔액 및 거래 내역 조회
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id');

    if (!profileId) {
      return NextResponse.json(
        { error: 'profile_id가 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 잔액 계산: 가장 최근 balance_after
    const { data: latestTransaction }: SupabaseQueryResult<PointsLedgerRow> = await supabase
      .from('points_ledger')
      .select('balance_after')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentBalance = latestTransaction?.balance_after ?? 0;

    // 거래 내역 조회 (최근 50개)
    const { data: transactions, error: transactionsError }: SupabaseQueryResult<PointsLedgerRow[]> = await supabase
      .from('points_ledger')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return NextResponse.json(
        { error: '거래 내역을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile_id: profileId,
      current_balance: currentBalance,
      transactions: transactions || [],
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/points');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RewardRow, ProfileRow, PointsLedgerRow, RedemptionRow } from '@/lib/supabase/types';
import { getSessionFromRequest, requireAuth } from '@/lib/auth/session';

// Supabase 타입 체인 호환성을 위한 타입
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQueryResult<T> = { data: T | null; error: any };

/**
 * GET /api/rewards/redemptions?profile_id=xxx
 * 보상 교환 내역 조회
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profile_id');
    const status = searchParams.get('status');

    // --- 세션 검증 추가 ---
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    // 부모는 모든 기록을 볼 수 있지만, 아이는 자기 것만 볼 수 있음
    if (session.userRole === 'child' && profileId !== session.userId) {
      return NextResponse.json({ error: '자신의 교환 내역만 조회할 수 있습니다.' }, { status: 403 });
    }
    // --- 검증 종료 ---

    let query = supabase
      .from('reward_redemptions')
      .select('*, rewards(*)')
      .order('redeemed_at', { ascending: false });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: redemptions, error }: SupabaseQueryResult<RedemptionRow[]> = await query;

    if (error) {
      console.error('Error fetching redemptions:', error);
      return NextResponse.json(
        { error: '교환 내역을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ redemptions: redemptions || [] });
  } catch (error) {
    console.error('Error in GET /api/rewards/redemptions:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rewards/redemptions
 * 보상 교환 요청 (포인트 차감 포함) - *보안 강화*
 */
export async function POST(request: NextRequest) {
  try {
    // --- 세션 검증 추가 ---
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    if (session.userRole !== 'child') {
      return NextResponse.json({ error: '보상 교환은 아이만 할 수 있습니다.' }, { status: 403 });
    }
    // --- 검증 종료 ---

    const body = await request.json();
    const { reward_id } = body as { reward_id: string };

    if (!reward_id) {
      return NextResponse.json(
        { error: '보상 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 보상 정보 확인
    const { data: reward, error: rewardError }: SupabaseQueryResult<RewardRow> = await supabase
      .from('rewards')
      .select('*')
      .eq('id', reward_id)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: '보상을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!reward.is_active) {
      return NextResponse.json(
        { error: '비활성화된 보상입니다.' },
        { status: 400 }
      );
    }

    // 현재 포인트 잔액 조회 (세션 ID 사용)
    const { data: latestTransaction }: SupabaseQueryResult<PointsLedgerRow> = await supabase
      .from('points_ledger')
      .select('balance_after')
      .eq('profile_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentBalance = latestTransaction?.balance_after ?? 0;

    // 포인트 충분한지 확인
    if (currentBalance < reward.points_cost) {
      return NextResponse.json(
        { error: `포인트가 부족합니다. (보유: ${currentBalance}P, 필요: ${reward.points_cost}P)` },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - reward.points_cost;

    // 트랜잭션 시작: 포인트 차감 + 교환 요청 생성
    // 1. 포인트 원장에 거래 기록 추가 (차감) - 세션 ID 사용
    const { error: ledgerError } = await supabase
      .from('points_ledger')
      .insert({
        profile_id: session.userId,
        reward_id,
        points_change: -reward.points_cost,
        balance_after: newBalance,
        transaction_type: 'spent',
        notes: `보상 "${reward.title}" 교환으로 인한 포인트 차감`,
      });

    if (ledgerError) {
      console.error('Error creating points transaction:', ledgerError);
      return NextResponse.json(
        { error: '포인트 차감에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 교환 요청 생성 - 세션 ID 사용
    const { data: redemption, error: redemptionError }: SupabaseQueryResult<RedemptionRow> = await supabase
      .from('reward_redemptions')
      .insert({
        reward_id,
        profile_id: session.userId,
        points_spent: reward.points_cost,
        status: 'pending',
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError);
      // 포인트 차감은 이미 기록되었으므로, 로그만 남기고 교환 요청 생성 실패 처리
      return NextResponse.json(
        { error: '교환 요청 생성에 실패했습니다. (포인트는 차감되었습니다)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      redemption,
      points_deducted: reward.points_cost,
      new_balance: newBalance,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/rewards/redemptions:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

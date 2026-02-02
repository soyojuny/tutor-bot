import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withParent, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { ActivityCompletionRow, ActivityRow, SupabaseQueryResult } from '@/lib/supabase/types';
import { getCurrentBalance, addPointsTransaction } from '@/lib/services/points';
import { updateStreak } from '@/lib/services/streaks';

/**
 * POST /api/completions/[id]/verify
 * 완료 기록을 검증하고 포인트를 지급 (부모만 가능)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 완료 기록 조회
    const { data: completionData, error: fetchError }: SupabaseQueryResult<ActivityCompletionRow> = await supabase
      .from('activity_completions')
      .select('*')
      .eq('id', id)
      .eq('family_id', session.familyId)
      .single();

    if (fetchError || !completionData) {
      return NextResponse.json(
        { error: '완료 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const completion = completionData;

    // 이미 검증된 경우
    if (completion.status === 'verified') {
      return NextResponse.json(
        { error: '이미 검증된 완료 기록입니다.' },
        { status: 400 }
      );
    }

    // 활동 정보 조회 (포인트 값)
    const { data: activityData, error: activityError }: SupabaseQueryResult<ActivityRow> = await supabase
      .from('activities')
      .select('id, title, points_value')
      .eq('id', completion.activity_id)
      .eq('family_id', session.familyId)
      .single();

    if (activityError || !activityData) {
      return NextResponse.json(
        { error: '활동 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const activity = activityData;

    // 현재 포인트 잔액 조회
    const previousBalance = await getCurrentBalance(supabase, completion.profile_id, session.familyId);
    const newBalance = previousBalance + activity.points_value;

    // 1. 포인트 원장에 거래 기록 추가
    const { error: ledgerError } = await addPointsTransaction(supabase, {
      profileId: completion.profile_id,
      familyId: session.familyId,
      completionId: id,
      pointsChange: activity.points_value,
      balanceAfter: newBalance,
      transactionType: 'earned',
      notes: `활동 "${activity.title}" 완료로 인한 포인트 지급`,
    });

    if (ledgerError) {
      console.error('Error creating points transaction:', ledgerError);
      return NextResponse.json(
        { error: '포인트 지급에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 완료 기록 상태를 verified로 업데이트
    const { data: updatedCompletion, error: updateError } = await supabase
      .from('activity_completions')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: session.userId,
        points_awarded: activity.points_value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('family_id', session.familyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating completion:', updateError);
      return NextResponse.json(
        { error: '완료 기록 상태 업데이트에 실패했습니다. (포인트는 지급되었습니다)' },
        { status: 500 }
      );
    }

    // 3. 연속 달성일 업데이트
    try {
      await updateStreak(supabase, completion.profile_id, session.familyId);
    } catch (streakError) {
      console.error('Error updating streak (non-critical):', streakError);
    }

    return NextResponse.json({
      completion: updatedCompletion,
      points_awarded: activity.points_value,
      new_balance: newBalance,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/completions/[id]/verify');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest, requireParent } from '@/lib/auth/session';

// Supabase 타입 체인 호환성을 위한 타입
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQueryResult<T> = { data: T | null; error: any };

interface CompletionRow {
  id: string;
  activity_id: string;
  profile_id: string;
  status: string;
  points_awarded: number | null;
}

interface ActivityRow {
  id: string;
  title: string;
  points_value: number;
}

interface PointsLedgerRow {
  balance_after: number;
}

interface DailyStreakRow {
  profile_id: string;
  streak_count: number;
  longest_streak: number;
  last_activity_date: string;
}

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

    // 세션 검증 - 부모만 검증 가능
    const session = await getSessionFromRequest(request);
    if (!requireParent(session)) {
      return NextResponse.json(
        { error: '부모만 완료 기록을 검증할 수 있습니다.' },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 완료 기록 조회
    const { data: completionData, error: fetchError }: SupabaseQueryResult<CompletionRow> = await supabase
      .from('activity_completions')
      .select('*')
      .eq('id', id)
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
      .single();

    if (activityError || !activityData) {
      return NextResponse.json(
        { error: '활동 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const activity = activityData;

    // 현재 포인트 잔액 조회
    const { data: latestTransactionData }: SupabaseQueryResult<PointsLedgerRow> = await supabase
      .from('points_ledger')
      .select('balance_after')
      .eq('profile_id', completion.profile_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const previousBalance = latestTransactionData?.balance_after ?? 0;
    const newBalance = previousBalance + activity.points_value;

    // 1. 포인트 원장에 거래 기록 추가
    const { error: ledgerError } = await supabase
      .from('points_ledger')
      .insert({
        profile_id: completion.profile_id,
        completion_id: id,
        points_change: activity.points_value,
        balance_after: newBalance,
        transaction_type: 'earned',
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
      const today = new Date().toISOString().split('T')[0];

      const { data: existingStreakData }: SupabaseQueryResult<DailyStreakRow> = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('profile_id', completion.profile_id)
        .single();

      if (existingStreakData) {
        const lastDate = new Date(existingStreakData.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        let newStreakCount = existingStreakData.streak_count;
        let newLongestStreak = existingStreakData.longest_streak;

        if (diffDays === 1) {
          newStreakCount = existingStreakData.streak_count + 1;
          newLongestStreak = Math.max(newStreakCount, existingStreakData.longest_streak);
        } else if (diffDays > 1) {
          newStreakCount = 1;
        }

        await supabase
          .from('daily_streaks')
          .update({
            streak_count: newStreakCount,
            longest_streak: newLongestStreak,
            last_activity_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('profile_id', completion.profile_id);
      } else {
        await supabase
          .from('daily_streaks')
          .insert({
            profile_id: completion.profile_id,
            streak_count: 1,
            longest_streak: 1,
            last_activity_date: today,
          });
      }
    } catch (streakError) {
      console.error('Error updating streak (non-critical):', streakError);
    }

    return NextResponse.json({
      completion: updatedCompletion,
      points_awarded: activity.points_value,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/completions/[id]/verify:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

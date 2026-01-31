import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withAuth, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { ActivityCompletionMetadata } from '@/types';
import { isAvailableToday } from '@/lib/constants/activities';
import { getKSTDateString } from '@/lib/utils/dates';
import { ActivityRow, ActivityCompletionRow, SupabaseQueryResult } from '@/lib/supabase/types';

/**
 * POST /api/activities/[id]/complete
 * 반복 활동의 완료 기록 생성 (아이가 사용)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

    const body = await request.json().catch(() => ({}));
    const metadata: ActivityCompletionMetadata = body.metadata || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 활동 정보 조회
    const { data: activityData, error: fetchError }: SupabaseQueryResult<ActivityRow> = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !activityData) {
      return NextResponse.json(
        { error: '활동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const activity = activityData;

    // 템플릿 활동이거나 담당자가 없는 공유 활동인 경우에만 이 API를 사용합니다.
    // 개별 할당된 일회성 활동은 PATCH /api/activities/[id]를 통해 상태를 직접 변경합니다.
    if (!activity.is_template && activity.assigned_to !== null) {
      return NextResponse.json(
        { error: '개별 할당된 일회성 활동은 이 API를 사용할 수 없습니다. PATCH /api/activities/[id]를 사용하세요.' },
        { status: 400 }
      );
    }

    // 할당된 아이인지 확인 (assigned_to가 null이면 전체 대상 → 모든 자녀 허용)
    if (activity.assigned_to !== null && activity.assigned_to !== session.userId) {
      return NextResponse.json(
        { error: '이 활동에 할당되지 않았습니다.' },
        { status: 403 }
      );
    }

    // 오늘이 해당 빈도에 맞는 날인지 확인
    if (!isAvailableToday(activity.frequency as 'once' | 'weekdays' | 'daily')) {
      return NextResponse.json(
        { error: '오늘은 이 활동을 수행할 수 없는 날입니다.' },
        { status: 400 }
      );
    }

    // 오늘 완료 횟수 확인 (모든 상태 카운트 - 하루 최대 횟수 제한)
    const today = getKSTDateString(); // KST 기준
    const { data: todayCompletions, error: countError }: SupabaseQueryResult<ActivityCompletionRow[]> = await supabase
      .from('activity_completions')
      .select('id')
      .eq('activity_id', id)
      .eq('profile_id', session.userId)
      .eq('completed_date', today);

    if (countError) {
      console.error('Error counting completions:', countError);
      return NextResponse.json(
        { error: '완료 횟수 확인에 실패했습니다.' },
        { status: 500 }
      );
    }

    const todayCount = todayCompletions?.length || 0;

    if (todayCount >= activity.max_daily_count) {
      return NextResponse.json(
        {
          error: `오늘 최대 횟수(${activity.max_daily_count}회)에 도달했습니다.`,
          today_count: todayCount,
          max_count: activity.max_daily_count,
        },
        { status: 400 }
      );
    }

    // 완료 기록 생성
    const { data: completion, error: insertError } = await supabase
      .from('activity_completions')
      .insert({
        activity_id: id,
        profile_id: session.userId,
        completed_date: today,
        status: 'completed',
        metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating completion:', insertError);
      return NextResponse.json(
        { error: '완료 기록 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      completion,
      today_count: todayCount + 1,
      remaining_today: activity.max_daily_count - (todayCount + 1),
      message: `활동을 완료했습니다. (${todayCount + 1}/${activity.max_daily_count})`,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/activities/[id]/complete');
  }
}

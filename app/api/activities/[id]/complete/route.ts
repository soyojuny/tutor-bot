import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest, requireAuth } from '@/lib/auth/session';
import { ActivityCompletionMetadata } from '@/types';
import { isAvailableToday } from '@/lib/constants/activities';

// Supabase 타입 체인 호환성을 위한 타입
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQueryResult<T> = { data: T | null; error: any };

interface ActivityRow {
  id: string;
  title: string;
  points_value: number;
  assigned_to: string | null;
  frequency: string;
  max_daily_count: number;
  is_template: boolean;
  status: string;
}

interface CompletionRow {
  id: string;
  activity_id: string;
  profile_id: string;
  completed_date: string;
}

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

    // 세션 검증
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

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

    // 반복 활동(템플릿)인지 확인
    if (!activity.is_template) {
      return NextResponse.json(
        { error: '일회성 활동은 이 API를 사용할 수 없습니다. PATCH /api/activities/[id]를 사용하세요.' },
        { status: 400 }
      );
    }

    // 할당된 아이인지 확인
    if (activity.assigned_to !== session.userId) {
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

    // 오늘 완료 횟수 확인
    const today = new Date().toISOString().split('T')[0];
    const { data: todayCompletions, error: countError }: SupabaseQueryResult<CompletionRow[]> = await supabase
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
    console.error('Error in POST /api/activities/[id]/complete:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

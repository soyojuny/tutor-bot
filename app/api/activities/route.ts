import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest, requireAuth, requireParent } from '@/lib/auth/session';
import { CreateActivityInput, Activity, ActivityWithTodayStatus, ActivityCompletion } from '@/types';
import { ActivityRow, ProfileRow } from '@/lib/supabase/types';
import { isAvailableToday } from '@/lib/constants/activities';

/**
 * GET /api/activities
 * 활동 목록 조회 (인증 필요)
 */
export async function GET(request: NextRequest) {
  try {
    // 세션 검증
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const searchParams = request.nextUrl.searchParams;

    // 선택적 필터링
    const assignedTo = searchParams.get('assigned_to');
    const status = searchParams.get('status');
    const createdBy = searchParams.get('created_by');

    let query = supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        { error: '활동 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // include_today_status 파라미터가 있으면 당일 완료 정보 추가
    const includeTodayStatus = searchParams.get('include_today_status') === 'true';

    if (includeTodayStatus && activities && activities.length > 0) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const activityIds = activities.map((a: ActivityRow) => a.id);

      // 오늘의 완료 기록 조회
      const { data: completions } = await supabase
        .from('activity_completions')
        .select('*')
        .in('activity_id', activityIds)
        .eq('completed_date', today);

      // 검증 대기 중인 완료 기록 조회 (assignedTo 기준)
      let pendingCompletions: ActivityCompletion[] = [];
      if (assignedTo) {
        const { data: pending } = await supabase
          .from('activity_completions')
          .select('*')
          .eq('profile_id', assignedTo)
          .eq('status', 'completed');
        pendingCompletions = (pending || []) as ActivityCompletion[];
      }

      const activitiesWithStatus: ActivityWithTodayStatus[] = activities.map((activity: ActivityRow) => {
        const activityCompletions = (completions || []).filter(
          (c: { activity_id: string; profile_id: string }) =>
            c.activity_id === activity.id &&
            (assignedTo ? c.profile_id === assignedTo : true)
        );
        const todayCount = activityCompletions.length;
        const isAvailable = isAvailableToday(activity.frequency);
        // can_complete: 오늘 완료 횟수가 최대 횟수 미만인지 확인
        const canComplete = activity.is_template
          ? isAvailable && todayCount < activity.max_daily_count
          : activity.status === 'pending' || activity.status === 'in_progress';

        return {
          ...activity,
          today_completion_count: todayCount,
          can_complete_today: canComplete,
          is_available_today: isAvailable,
          pending_completions: pendingCompletions.filter(
            (c: ActivityCompletion) => c.activity_id === activity.id
          ),
        } as ActivityWithTodayStatus;
      });

      return NextResponse.json({ activities: activitiesWithStatus });
    }

    return NextResponse.json({ activities: (activities || []) as Activity[] });
  } catch (error) {
    console.error('Error in GET /api/activities:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activities
 * 새 활동 생성 (부모만 가능)
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 검증 - 부모만 활동 생성 가능
    const session = await getSessionFromRequest(request);
    if (!requireParent(session)) {
      return NextResponse.json(
        { error: '활동은 부모만 생성할 수 있습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input = body as CreateActivityInput;

    // 입력 검증
    if (!input.title || !input.category) {
      return NextResponse.json(
        { error: '제목과 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // assigned_to가 있으면 해당 프로필이 존재하는지 확인
    if (input.assigned_to) {
      const { data: assigneeData, error: assigneeError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', input.assigned_to)
        .single();

      if (assigneeError || !assigneeData || (assigneeData as ProfileRow).role !== 'child') {
        return NextResponse.json(
          { error: '유효하지 않은 할당 대상입니다.' },
          { status: 400 }
        );
      }
    }

    // 빈도 기반 is_template 결정
    const frequency = input.frequency || 'once';
    const isTemplate = frequency !== 'once';
    const maxDailyCount = input.max_daily_count || 1;

    // 활동 생성 - 세션에서 사용자 ID 사용
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        ...input,
        created_by: session.userId,
        status: 'pending',
        frequency,
        max_daily_count: maxDailyCount,
        is_template: isTemplate,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return NextResponse.json(
        { error: '활동 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity: activity as ActivityRow }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/activities:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

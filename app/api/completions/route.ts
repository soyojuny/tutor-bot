import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest, requireAuth } from '@/lib/auth/session';

/**
 * GET /api/completions
 * 활동 완료 기록 조회 (인증 필요)
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

    // 필터링 파라미터
    const activityId = searchParams.get('activity_id');
    const profileId = searchParams.get('profile_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    let query = supabase
      .from('activity_completions')
      .select(`
        *,
        activity:activities(id, title, category, points_value, frequency),
        profile:profiles!activity_completions_profile_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false });

    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('completed_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('completed_date', dateTo);
    }

    const { data: completions, error } = await query;

    if (error) {
      console.error('Error fetching completions:', error);
      return NextResponse.json(
        { error: '완료 기록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ completions: completions || [] });
  } catch (error) {
    console.error('Error in GET /api/completions:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest, requireAuth, requireParent } from '@/lib/auth/session';
import { CreateActivityInput } from '@/types';
import { ActivityRow, ProfileRow } from '@/lib/supabase/types';

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

    return NextResponse.json({ activities: activities || [] });
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

    // 활동 생성 - 세션에서 사용자 ID 사용
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        ...input,
        created_by: session.userId,
        status: 'pending',
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

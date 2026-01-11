import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CreateActivityInput } from '@/types';

/**
 * GET /api/activities
 * 활동 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
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
 * 새 활동 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { created_by, ...input } = body as CreateActivityInput & { created_by: string };

    // 입력 검증
    if (!input.title || !input.category) {
      return NextResponse.json(
        { error: '제목과 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    if (!created_by) {
      return NextResponse.json(
        { error: '생성자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 권한 검증: 생성자는 부모여야 함
    const supabase = createAdminClient();
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', created_by)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: '유효하지 않은 사용자입니다.' },
        { status: 400 }
      );
    }

    if (creator.role !== 'parent') {
      return NextResponse.json(
        { error: '활동은 부모만 생성할 수 있습니다.' },
        { status: 403 }
      );
    }

    // assigned_to가 있으면 해당 프로필이 존재하는지 확인
    if (input.assigned_to) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', input.assigned_to)
        .single();

      if (assigneeError || !assignee || assignee.role !== 'child') {
        return NextResponse.json(
          { error: '유효하지 않은 할당 대상입니다.' },
          { status: 400 }
        );
      }
    }

    // 활동 생성
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        ...input,
        created_by,
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

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/activities:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest, requireAuth, requireParent } from '@/lib/auth/session';
import { UpdateActivityInput } from '@/types';
import { ActivityRow, ActivityUpdate } from '@/lib/supabase/types';

/**
 * PATCH /api/activities/[id]
 * 활동 업데이트 (인증 필요, 역할별 권한 검증)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 세션 검증
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const input = body as UpdateActivityInput;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 기존 활동 확인
    const { data: existingActivityData, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingActivityData) {
      return NextResponse.json(
        { error: '활동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingActivity = existingActivityData as ActivityRow;

    // 권한 검증: 아이는 자신에게 할당된 활동만 상태 변경 가능
    if (session.role === 'child') {
      if (existingActivity.assigned_to !== session.userId) {
        return NextResponse.json(
          { error: '이 활동을 수정할 권한이 없습니다.' },
          { status: 403 }
        );
      }
      // 아이는 상태만 변경 가능 (시작/완료)
      const allowedStatuses = ['in_progress', 'completed'];
      if (input.status && !allowedStatuses.includes(input.status)) {
        return NextResponse.json(
          { error: '허용되지 않은 상태 변경입니다.' },
          { status: 403 }
        );
      }
    }

    // 업데이트할 필드 준비
    const updates: ActivityUpdate = {
      updated_at: new Date().toISOString(),
    };

    // 부모만 모든 필드 수정 가능
    if (session.role === 'parent') {
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.category !== undefined) updates.category = input.category;
      if (input.points_value !== undefined) updates.points_value = input.points_value;
      if (input.due_date !== undefined) updates.due_date = input.due_date;
    }

    // 상태 업데이트 (부모/아이 모두)
    if (input.status !== undefined) updates.status = input.status;

    // 상태 전환 시 타임스탬프 업데이트
    if (input.status === 'completed' && existingActivity.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    if (input.status === 'verified' && existingActivity.status !== 'verified') {
      updates.verified_at = new Date().toISOString();
    }

    // 활동 업데이트
    const { data: activity, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      return NextResponse.json(
        { error: '활동 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity: activity as ActivityRow });
  } catch (error) {
    console.error('Error in PATCH /api/activities/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/activities/[id]
 * 활동 삭제 (부모만 가능)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 세션 검증 - 부모만 삭제 가능
    const session = await getSessionFromRequest(request);
    if (!requireParent(session)) {
      return NextResponse.json(
        { error: '활동 삭제는 부모만 가능합니다.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 기존 활동 확인
    const { data: existingActivity, error: fetchError } = await supabase
      .from('activities')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingActivity) {
      return NextResponse.json(
        { error: '활동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 활동 삭제
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      return NextResponse.json(
        { error: '활동 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/activities/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

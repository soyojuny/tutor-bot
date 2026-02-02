import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withAuth, withParent, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { UpdateActivityInput } from '@/types';
import { ActivityRow, ActivityUpdate } from '@/lib/supabase/types';
import { getKSTDateString } from '@/lib/utils/dates';

/**
 * PATCH /api/activities/[id]
 * 활동 업데이트 (인증 필요, 역할별 권한 검증)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

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
      .eq('family_id', session.familyId)
      .single();

    if (fetchError || !existingActivityData) {
      return NextResponse.json(
        { error: '활동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingActivity = existingActivityData as ActivityRow;

    // 권한 검증: 아이는 자신에게 할당된 활동 또는 전체 대상 활동만 상태 변경 가능
    if (session.role === 'child') {
      // assigned_to가 null이면 전체 대상 → 모든 자녀 허용
      // assigned_to가 있으면 해당 자녀만 허용
      if (existingActivity.assigned_to !== null && existingActivity.assigned_to !== session.userId) {
        return NextResponse.json(
          { error: '이 활동을 수정할 권한이 없습니다.' },
          { status: 403 }
        );
      }

      // 반복 활동은 이 API로 상태 변경 불가 (complete API 사용)
      if (existingActivity.is_template) {
        return NextResponse.json(
          { error: '반복 활동은 /api/activities/[id]/complete API를 사용하세요.' },
          { status: 400 }
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

    // 전체 대상 일회성 활동의 완료 처리: activity_completions에 기록
    const isGlobalActivity = existingActivity.assigned_to === null && !existingActivity.is_template;
    if (session.role === 'child' && isGlobalActivity && input.status === 'completed') {
      const today = getKSTDateString(); // KST 기준

      // 이미 오늘 완료 기록이 있는지 확인
      const { data: existingCompletion } = await supabase
        .from('activity_completions')
        .select('id')
        .eq('family_id', session.familyId)
        .eq('activity_id', id)
        .eq('profile_id', session.userId)
        .eq('completed_date', today)
        .single();

      if (existingCompletion) {
        return NextResponse.json(
          { error: '오늘 이미 이 활동을 완료했습니다.' },
          { status: 400 }
        );
      }

      // activity_completions에 완료 기록 생성
      const { data: completion, error: completionError } = await supabase
        .from('activity_completions')
        .insert({
          activity_id: id,
          profile_id: session.userId,
          family_id: session.familyId,
          completed_date: today,
          status: 'completed',
        })
        .select()
        .single();

      if (completionError) {
        console.error('Error creating completion:', completionError);
        return NextResponse.json(
          { error: '완료 기록 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      // 전체 대상 활동은 activities.status를 변경하지 않음 (다른 아이도 해야 하므로)
      return NextResponse.json({
        activity: existingActivity,
        completion,
        message: '활동 완료가 기록되었습니다. 부모님의 확인을 기다려주세요.',
      });
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
      if (input.frequency !== undefined) updates.frequency = input.frequency;
      if (input.max_daily_count !== undefined) updates.max_daily_count = input.max_daily_count;

      // assigned_to 변경: pending 상태일 때만 가능
      if (input.assigned_to !== undefined) {
        if (existingActivity.status !== 'pending') {
          return NextResponse.json(
            { error: '진행 중이거나 완료된 활동은 배정을 변경할 수 없습니다.' },
            { status: 400 }
          );
        }
        updates.assigned_to = input.assigned_to || null;
      }
    }

    // 상태 업데이트 (개별 할당 일회성 활동만)
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
      .eq('family_id', session.familyId)
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
    return handleApiError(error, 'PATCH /api/activities/[id]');
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
    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 기존 활동 확인
    const { data: existingActivity, error: fetchError } = await supabase
      .from('activities')
      .select('id')
      .eq('id', id)
      .eq('family_id', session.familyId)
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
      .eq('id', id)
      .eq('family_id', session.familyId);

    if (error) {
      console.error('Error deleting activity:', error);
      return NextResponse.json(
        { error: '활동 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/activities/[id]');
  }
}

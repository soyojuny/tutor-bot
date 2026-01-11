import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UpdateActivityInput } from '@/types';

/**
 * PATCH /api/activities/[id]
 * 활동 업데이트
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = body as UpdateActivityInput;

    const supabase = createAdminClient();

    // 기존 활동 확인
    const { data: existingActivity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingActivity) {
      return NextResponse.json(
        { error: '활동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트 가능한 필드만 추출
    const updateData: Partial<UpdateActivityInput> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.points_value !== undefined) updateData.points_value = input.points_value;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;

    // 상태 전환 시 타임스탬프 업데이트
    if (input.status === 'completed' && existingActivity.status !== 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    if (input.status === 'verified' && existingActivity.status !== 'verified') {
      // verified_by는 요청에서 받아야 하지만, 일단 null로 설정 (나중에 추가)
      updateData.verified_at = new Date().toISOString();
    }

    // 활동 업데이트
    const { data: activity, error } = await supabase
      .from('activities')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
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

    return NextResponse.json({ activity });
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
 * 활동 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

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

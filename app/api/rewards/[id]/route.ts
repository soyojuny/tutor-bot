import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleApiError } from '@/lib/api/helpers';
import { UpdateRewardInput } from '@/types';
import { RewardRow, SupabaseQueryResult } from '@/lib/supabase/types';

/**
 * PATCH /api/rewards/[id]
 * 보상 업데이트
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = body as UpdateRewardInput;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 기존 보상 확인
    const { data: existingReward, error: fetchError }: SupabaseQueryResult<RewardRow> = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingReward) {
      return NextResponse.json(
        { error: '보상을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 업데이트 가능한 필드만 추출
    const updateData: Partial<UpdateRewardInput> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.points_cost !== undefined) updateData.points_cost = input.points_cost;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.icon_emoji !== undefined) updateData.icon_emoji = input.icon_emoji;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    // 보상 업데이트
    const { data: reward, error }: SupabaseQueryResult<RewardRow> = await supabase
      .from('rewards')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reward:', error);
      return NextResponse.json(
        { error: '보상 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/rewards/[id]');
  }
}

/**
 * DELETE /api/rewards/[id]
 * 보상 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 기존 보상 확인
    const { data: existingReward, error: fetchError }: SupabaseQueryResult<RewardRow> = await supabase
      .from('rewards')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingReward) {
      return NextResponse.json(
        { error: '보상을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 보상 삭제
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reward:', error);
      return NextResponse.json(
        { error: '보상 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/rewards/[id]');
  }
}

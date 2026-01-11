import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RedemptionStatus } from '@/types';

/**
 * PATCH /api/rewards/redemptions/[id]
 * 보상 교환 상태 업데이트 (승인/거부/완료)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, fulfilled_by } = body as { status: RedemptionStatus; fulfilled_by?: string };

    if (!status) {
      return NextResponse.json(
        { error: '상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 기존 교환 내역 확인
    const { data: existingRedemption, error: fetchError } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRedemption) {
      return NextResponse.json(
        { error: '교환 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 상태 전환 시 타임스탬프 업데이트
    const updateData: { status: RedemptionStatus; fulfilled_at?: string; fulfilled_by?: string } = {
      status,
    };

    if (status === 'fulfilled' && existingRedemption.status !== 'fulfilled') {
      updateData.fulfilled_at = new Date().toISOString();
      if (fulfilled_by) {
        updateData.fulfilled_by = fulfilled_by;
      }
    }

    // 교환 상태 업데이트
    const { data: redemption, error } = await supabase
      .from('reward_redemptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating redemption:', error);
      return NextResponse.json(
        { error: '교환 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ redemption });
  } catch (error) {
    console.error('Error in PATCH /api/rewards/redemptions/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

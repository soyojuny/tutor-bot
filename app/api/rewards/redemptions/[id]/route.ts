import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleApiError, withParent, isErrorResponse } from '@/lib/api/helpers';
import { RedemptionStatus } from '@/types';
import { RedemptionRow, SupabaseQueryResult } from '@/lib/supabase/types';

/**
 * PATCH /api/rewards/redemptions/[id]
 * 보상 교환 상태 업데이트 (승인/거부/완료)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    const { id } = await params;
    const body = await request.json();
    const { status, fulfilled_by } = body as { status: RedemptionStatus; fulfilled_by?: string };

    if (!status) {
      return NextResponse.json(
        { error: '상태가 필요합니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 기존 교환 내역 확인
    const { data: existingRedemption, error: fetchError }: SupabaseQueryResult<RedemptionRow> = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('id', id)
      .eq('family_id', session.familyId)
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
    const { data: redemption, error }: SupabaseQueryResult<RedemptionRow> = await supabase
      .from('reward_redemptions')
      .update(updateData)
      .eq('id', id)
      .eq('family_id', session.familyId)
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
    return handleApiError(error, 'PATCH /api/rewards/redemptions/[id]');
  }
}

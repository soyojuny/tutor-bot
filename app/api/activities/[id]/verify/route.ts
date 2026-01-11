import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/activities/[id]/verify
 * 활동을 검증하고 포인트를 지급
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { verified_by } = body as { verified_by: string };

    if (!verified_by) {
      return NextResponse.json(
        { error: '검증자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 기존 활동 확인
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !activity) {
      return NextResponse.json(
        { error: '활동을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 검증 가능 상태 확인
    if (activity.status !== 'completed') {
      return NextResponse.json(
        { error: '완료된 활동만 검증할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 할당 대상 확인
    if (!activity.assigned_to) {
      return NextResponse.json(
        { error: '할당된 아이가 없습니다.' },
        { status: 400 }
      );
    }

    // 검증자 권한 확인 (부모여야 함)
    const { data: verifier, error: verifierError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', verified_by)
      .single();

    if (verifierError || !verifier || verifier.role !== 'parent') {
      return NextResponse.json(
        { error: '부모만 활동을 검증할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 현재 포인트 잔액 조회
    const { data: latestTransaction, error: balanceError } = await supabase
      .from('points_ledger')
      .select('balance_after')
      .eq('profile_id', activity.assigned_to)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const previousBalance = latestTransaction?.balance_after || 0;
    const newBalance = previousBalance + activity.points_value;

    // 트랜잭션 시작: 활동 상태 업데이트 + 포인트 지급
    // Note: Supabase는 트랜잭션을 지원하지 않으므로, 순차적으로 처리
    // 실제 프로덕션에서는 PostgreSQL 트랜잭션을 사용해야 함

    // 1. 포인트 원장에 거래 기록 추가
    const { error: ledgerError } = await supabase
      .from('points_ledger')
      .insert({
        profile_id: activity.assigned_to,
        activity_id: id,
        points_change: activity.points_value,
        balance_after: newBalance,
        transaction_type: 'earned',
        notes: `활동 "${activity.title}" 완료로 인한 포인트 지급`,
      });

    if (ledgerError) {
      console.error('Error creating points transaction:', ledgerError);
      return NextResponse.json(
        { error: '포인트 지급에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 활동 상태를 verified로 업데이트
    const { data: updatedActivity, error: updateError } = await supabase
      .from('activities')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating activity:', updateError);
      // 포인트 거래는 이미 기록되었으므로, 로그만 남기고 활동 상태 업데이트 실패 처리
      return NextResponse.json(
        { error: '활동 상태 업데이트에 실패했습니다. (포인트는 지급되었습니다)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activity: updatedActivity,
      points_awarded: activity.points_value,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error in POST /api/activities/[id]/verify:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

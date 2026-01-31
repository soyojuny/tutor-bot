import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CreateRewardInput } from '@/types';
import { RewardRow, SupabaseQueryResult } from '@/lib/supabase/types';
import { withParent, isErrorResponse, handleApiError } from '@/lib/api/helpers';

/**
 * GET /api/rewards
 * 보상 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('rewards')
      .select('*, created_by:profiles(name)')
      .order('created_at', { ascending: false });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: rewards, error }: SupabaseQueryResult<RewardRow[]> = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json(
        { error: '보상 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error) {
    return handleApiError(error, 'GET /api/rewards');
  }
}

/**
 * POST /api/rewards
 * 새 보상 생성 - *보안 강화*
 */
export async function POST(request: NextRequest) {
  try {
    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    const input = (await request.json()) as CreateRewardInput;

    // 입력 검증
    if (!input.title || input.points_cost === undefined) {
      return NextResponse.json(
        { error: '제목과 포인트 비용은 필수입니다.' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 보상 생성 - 세션 ID 사용
    const { data: reward, error }: SupabaseQueryResult<RewardRow> = await supabase
      .from('rewards')
      .insert({
        ...input,
        created_by: session.userId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return NextResponse.json(
        { error: '보상 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/rewards');
  }
}

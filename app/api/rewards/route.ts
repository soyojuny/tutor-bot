import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CreateRewardInput } from '@/types';
import { RewardRow, ProfileRow } from '@/lib/supabase/types';

// Supabase 타입 체인 호환성을 위한 타입
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseQueryResult<T> = { data: T | null; error: any };

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
      .select('*')
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
    console.error('Error in GET /api/rewards:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rewards
 * 새 보상 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { created_by, ...input } = body as CreateRewardInput & { created_by: string };

    // 입력 검증
    if (!input.title || input.points_cost === undefined) {
      return NextResponse.json(
        { error: '제목과 포인트 비용은 필수입니다.' },
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const { data: creator, error: creatorError }: SupabaseQueryResult<ProfileRow> = await supabase
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
        { error: '보상은 부모만 생성할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 보상 생성
    const { data: reward, error }: SupabaseQueryResult<RewardRow> = await supabase
      .from('rewards')
      .insert({
        ...input,
        created_by,
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
    console.error('Error in POST /api/rewards:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

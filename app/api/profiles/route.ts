import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest } from '@/lib/auth/session';

/**
 * GET /api/profiles
 * 프로필 목록 조회
 * - 로그인 전: 기본 정보만 반환 (id, name, role, avatar_url)
 * - 로그인 후: 세션에 따라 더 많은 정보 반환 가능
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    // 세션 확인 (선택적)
    const session = await getSessionFromRequest(request);

    // 민감하지 않은 필드만 선택 (pin_code 제외)
    let query = supabase
      .from('profiles')
      .select('id, name, role, age, avatar_url, created_at')
      .order('created_at', { ascending: true });

    // 역할 필터링
    if (role) {
      query = query.eq('role', role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: '프로필 목록을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 로그인하지 않은 경우 최소한의 정보만 반환
    if (!session) {
      const publicProfiles = (profiles || []).map((p: { id: string; name: string; role: string; avatar_url: string | null }) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        avatar_url: p.avatar_url,
      }));
      return NextResponse.json({ profiles: publicProfiles });
    }

    // 로그인한 경우 전체 정보 반환
    return NextResponse.json({ profiles: profiles || [] });
  } catch (error) {
    console.error('Error in GET /api/profiles:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/auth/me
 * 현재 로그인된 사용자 정보 조회 (familyId 포함)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.', user: null },
        { status: 401 }
      );
    }

    // 최신 프로필 정보 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, role, age, avatar_url, family_id')
      .eq('id', session.userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다.', user: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: profile,
      familyId: session.familyId,
    });
  } catch (error) {
    console.error('Error in GET /api/auth/me:', error);
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다.', user: null },
      { status: 500 }
    );
  }
}

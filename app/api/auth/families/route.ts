import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleApiError, getFamilyIdFromAuthUser } from '@/lib/api/helpers';
import { getSessionFromRequest } from '@/lib/auth/session';

/**
 * GET /api/auth/families
 * 현재 사용자의 가족 정보 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 프로필 세션에서 familyId 시도
    const session = await getSessionFromRequest(request);
    let familyId: string | null = session?.familyId ?? null;

    // 프로필 세션 없으면 Google Auth에서 조회
    if (!familyId) {
      familyId = await getFamilyIdFromAuthUser(request);
    }

    if (!familyId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data: family, error } = await supabase
      .from('families')
      .select('id, name, owner_id, created_at')
      .eq('id', familyId)
      .single();

    if (error || !family) {
      return NextResponse.json(
        { error: '가족 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ family });
  } catch (error) {
    return handleApiError(error, 'GET /api/auth/families');
  }
}

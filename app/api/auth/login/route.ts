import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSessionToken, getSupabaseUserFromRequest } from '@/lib/auth/session';
import { verifyPin } from '@/lib/utils/auth';
import { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

/**
 * POST /api/auth/login
 * 프로필 선택 로그인 (Google OAuth 세션 필수, PIN 선택적)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, pin } = body;

    if (!profileId) {
      return NextResponse.json(
        { error: '프로필 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. Supabase Auth 세션 확인 (Google 로그인 필수)
    const supabaseUser = await getSupabaseUserFromRequest(request);
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Google 로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // 2. 해당 사용자의 가족 조회
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('id')
      .eq('owner_id', supabaseUser.id)
      .limit(1)
      .single();

    if (familyError || !family) {
      return NextResponse.json(
        { error: '가족 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 3. 프로필 조회
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const profileData = profile as ProfileRow;

    // 4. 프로필이 이 가족에 속하는지 확인
    if (profileData.family_id !== family.id) {
      return NextResponse.json(
        { error: '이 프로필에 접근할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 5. PIN 검증 (설정된 경우에만)
    if (profileData.pin_code) {
      if (!pin) {
        return NextResponse.json(
          { error: 'PIN이 필요합니다.' },
          { status: 400 }
        );
      }

      const isHashed = profileData.pin_code.startsWith('$2a$') || profileData.pin_code.startsWith('$2b$');
      let isPinValid = false;

      if (isHashed) {
        isPinValid = await verifyPin(pin, profileData.pin_code);
      } else {
        // 평문 비교 (개발용)
        isPinValid = profileData.pin_code === pin;
      }

      if (!isPinValid) {
        return NextResponse.json(
          { error: 'PIN이 일치하지 않습니다.' },
          { status: 401 }
        );
      }
    }

    // 6. 세션 토큰 생성 (familyId 포함)
    const token = await createSessionToken({
      id: profileData.id,
      name: profileData.name,
      role: profileData.role as 'parent' | 'child',
      age: profileData.age,
      avatar_url: profileData.avatar_url,
      pin_code: profileData.pin_code,
      family_id: profileData.family_id,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    });

    // 7. 응답 생성 및 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: profileData.id,
        name: profileData.name,
        role: profileData.role,
        age: profileData.age,
        avatar_url: profileData.avatar_url,
        family_id: profileData.family_id,
      },
      familyId: family.id,
    });

    response.cookies.set('tutor-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

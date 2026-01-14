import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSessionToken } from '@/lib/auth/session';
import { verifyPin } from '@/lib/utils/auth';
import { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

/**
 * POST /api/auth/login
 * PIN 기반 로그인 및 세션 쿠키 설정
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId, pin } = body;

    if (!profileId || !pin) {
      return NextResponse.json(
        { error: '프로필 ID와 PIN이 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 프로필 조회
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

    // PIN 검증
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

    // 세션 토큰 생성
    const token = await createSessionToken({
      id: profileData.id,
      name: profileData.name,
      role: profileData.role as 'parent' | 'child',
      age: profileData.age,
      avatar_url: profileData.avatar_url,
      pin_code: profileData.pin_code,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    });

    // 응답 생성 및 쿠키 설정
    const response = NextResponse.json({
      success: true,
      user: {
        id: profileData.id,
        name: profileData.name,
        role: profileData.role,
        age: profileData.age,
        avatar_url: profileData.avatar_url,
      },
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

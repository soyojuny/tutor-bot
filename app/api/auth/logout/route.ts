import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/auth/logout
 * 이중 모드 로그아웃:
 * - mode: 'switch-profile' (기본): tutor-session만 삭제 → 프로필 선택으로
 * - mode: 'full': tutor-session + Supabase Auth 세션 모두 삭제 → 로그인으로
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const mode = body?.mode || 'switch-profile';

    const response = NextResponse.json({
      success: true,
      redirect: mode === 'full' ? '/login' : '/profiles',
    });

    // tutor-session 쿠키 삭제 (항상)
    response.cookies.set('tutor-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // full 모드: Supabase Auth 세션도 삭제
    if (mode === 'full') {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      await supabase.auth.signOut();
    }

    return response;
  } catch {
    // 에러가 나더라도 쿠키는 삭제
    const response = NextResponse.json({ success: true });
    response.cookies.set('tutor-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }
}

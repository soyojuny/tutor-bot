import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 세션 쿠키 삭제
 */
export async function POST() {
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

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { createServerClient } from '@supabase/ssr';
import { Profile } from '@/types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'tutor-bot-session-secret-key-change-in-production'
);

const SESSION_COOKIE_NAME = 'tutor-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7일

export interface SessionPayload {
  userId: string;
  role: 'parent' | 'child';
  name: string;
  familyId: string;
  exp: number;
}

/**
 * 세션 토큰 생성
 */
export async function createSessionToken(user: Profile): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION;

  const token = await new SignJWT({
    userId: user.id,
    role: user.role,
    name: user.name,
    familyId: user.family_id,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .sign(SECRET_KEY);

  return token;
}

/**
 * 세션 토큰 검증
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * 세션 쿠키 설정 (서버 액션용)
 */
export async function setSessionCookie(user: Profile): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

/**
 * 세션 쿠키 삭제
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * 현재 세션 조회
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * API 라우트용 세션 조회 (Request 헤더에서)
 */
export async function getSessionFromRequest(request: Request): Promise<SessionPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return acc;
    const key = trimmed.substring(0, equalsIndex);
    const value = trimmed.substring(equalsIndex + 1);
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

/**
 * Supabase Auth 사용자 조회 (Request 헤더에서)
 * Google OAuth 세션 확인용
 */
export async function getSupabaseUserFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  // Parse cookies from header for Supabase client
  const parsedCookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const trimmed = cookie.trim();
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) return;
    parsedCookies[trimmed.substring(0, equalsIndex)] = trimmed.substring(equalsIndex + 1);
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(parsedCookies).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll() {
          // No-op in API route context
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 권한 검증 헬퍼
 */
export function requireParent(session: SessionPayload | null): session is SessionPayload {
  return session !== null && session.role === 'parent';
}

export function requireChild(session: SessionPayload | null): session is SessionPayload {
  return session !== null && session.role === 'child';
}

export function requireAuth(session: SessionPayload | null): session is SessionPayload {
  return session !== null;
}

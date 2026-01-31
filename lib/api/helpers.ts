import { NextResponse } from 'next/server';
import {
  getSessionFromRequest,
  requireAuth,
  requireParent,
  requireChild,
  SessionPayload,
} from '@/lib/auth/session';

/**
 * 인증 가드 — 세션 또는 에러 응답 반환
 */
export async function withAuth(request: Request): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!requireAuth(session)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  return session;
}

export async function withParent(request: Request): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!requireParent(session)) {
    return NextResponse.json({ error: '부모만 접근할 수 있습니다.' }, { status: 403 });
  }
  return session;
}

export async function withChild(request: Request): Promise<SessionPayload | NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!requireChild(session)) {
    return NextResponse.json({ error: '아이만 접근할 수 있습니다.' }, { status: 403 });
  }
  return session;
}

/**
 * 타입 가드 — 에러 응답인지 확인
 */
export function isErrorResponse(result: SessionPayload | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * 에러 응답 헬퍼
 */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * API 에러 핸들러
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`Error in ${context}:`, error);
  const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  return NextResponse.json({ error: message }, { status: 500 });
}

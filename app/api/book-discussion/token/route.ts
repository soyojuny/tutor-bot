import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionFromRequest,
  requireAuth,
} from '@/lib/auth/session';
import { createLiveSessionToken } from '@/lib/gemini/client';
import { BookDiscussionTokenRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as BookDiscussionTokenRequest;

    if (!body.bookTitle || typeof body.bookTitle !== 'string') {
      return NextResponse.json(
        { error: '책 제목이 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await createLiveSessionToken(
      body.bookTitle.trim(),
      body.bookSummary,
      body.childAge
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/book-discussion/token:', error);
    return NextResponse.json(
      { error: '토큰 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

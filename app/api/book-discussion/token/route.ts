import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { createLiveSessionToken } from '@/lib/gemini/client';
import { BookDiscussionTokenRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

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
    return handleApiError(error, 'POST /api/book-discussion/token');
  }
}

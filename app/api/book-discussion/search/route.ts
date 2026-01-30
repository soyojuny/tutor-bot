import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionFromRequest,
  requireAuth,
} from '@/lib/auth/session';
import { searchBooks } from '@/lib/utils/google-books';
import { BookSearchResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!requireAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const q = request.nextUrl.searchParams.get('q');
    const title = request.nextUrl.searchParams.get('title');
    const author = request.nextUrl.searchParams.get('author');
    const publisher = request.nextUrl.searchParams.get('publisher');

    let query: string;

    if (title || author || publisher) {
      const parts: string[] = [];
      if (title) parts.push(`intitle:${title}`);
      if (author) parts.push(`inauthor:${author}`);
      if (publisher) parts.push(`inpublisher:${publisher}`);
      query = parts.join('+');
    } else if (q && q.trim()) {
      query = q.trim();
    } else {
      return NextResponse.json(
        { error: '검색어가 필요합니다.' },
        { status: 400 }
      );
    }

    const results = await searchBooks(query);
    const response: BookSearchResponse = { results };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/book-discussion/search:', error);
    return NextResponse.json(
      { error: '검색에 실패했습니다.' },
      { status: 500 }
    );
  }
}

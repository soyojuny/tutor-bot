import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { searchBooks } from '@/lib/utils/google-books';
import { BookSearchResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const q = request.nextUrl.searchParams.get('q');
    const title = request.nextUrl.searchParams.get('title');
    const author = request.nextUrl.searchParams.get('author');

    // Determine the search title (used for both query building and filtering)
    const searchTitle = title ?? q?.trim() ?? null;
    if (!searchTitle) {
      return NextResponse.json(
        { error: '검색어가 필요합니다.' },
        { status: 400 }
      );
    }

    const quoted = searchTitle.includes(' ') ? `"${searchTitle}"` : searchTitle;
    const query = author
      ? `intitle:${quoted} inauthor:${author}`
      : `intitle:${quoted}`;

    const raw = await searchBooks(query);

    // Filter: only keep books whose title matches the search title
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const target = normalize(searchTitle);
    const results = raw.filter((book) => {
      const bookTitle = normalize(book.title);
      return bookTitle.includes(target) || target.includes(bookTitle);
    });

    const response: BookSearchResponse = { results };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, 'GET /api/book-discussion/search');
  }
}

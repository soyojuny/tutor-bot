import { BookSearchResult } from '@/types';

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export async function searchBooks(
  query: string,
  maxResults: number = 3
): Promise<BookSearchResult[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_BOOKS_API_KEY is not set. Book search is disabled.');
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    langRestrict: 'ko',
    printType: 'books',
    key: apiKey,
  });

  const res = await fetch(`${GOOGLE_BOOKS_API_URL}?${params}`);
  if (!res.ok) {
    console.error('Google Books API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }

  return data.items.map((item: Record<string, unknown>) => {
    const info = item.volumeInfo as Record<string, unknown> | undefined;
    const imageLinks = info?.imageLinks as Record<string, string> | undefined;
    let thumbnail = imageLinks?.thumbnail ?? null;

    if (thumbnail) {
      thumbnail = thumbnail.replace(/^http:/, 'https:');
    }

    return {
      title: (info?.title as string) ?? '',
      authors: (info?.authors as string[]) ?? [],
      description: info?.description
        ? stripHtmlTags(info.description as string)
        : '',
      thumbnail,
    };
  });
}

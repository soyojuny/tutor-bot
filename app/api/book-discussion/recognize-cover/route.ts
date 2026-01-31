import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { extractBookInfoFromImage } from '@/lib/gemini/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isErrorResponse(authResult)) return authResult;

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 이미지 형식입니다. (JPEG, PNG, WebP만 가능)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '이미지 크기가 너무 큽니다. (최대 5MB)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const bookInfo = await extractBookInfoFromImage(base64, file.type);

    return NextResponse.json(bookInfo);
  } catch (error) {
    return handleApiError(error, 'POST /api/book-discussion/recognize-cover');
  }
}

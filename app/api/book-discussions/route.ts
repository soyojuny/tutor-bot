import { NextRequest, NextResponse } from 'next/server';
import { withChild, withParent, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDiscussionSummary } from '@/lib/gemini/client';
import { SaveBookDiscussionRequest } from '@/types';
import { BookDiscussionInsert, BookDiscussionRow } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const session = await withChild(request);
    if (isErrorResponse(session)) return session;

    const body = (await request.json()) as SaveBookDiscussionRequest;

    if (!body.bookTitle || typeof body.bookTitle !== 'string') {
      return NextResponse.json(
        { error: '책 제목이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.transcripts)) {
      return NextResponse.json(
        { error: '대화 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    const summary = await generateDiscussionSummary(
      body.bookTitle.trim(),
      body.transcripts
    );

    const supabase = createAdminClient();
    const insertData: BookDiscussionInsert = {
      profile_id: session.userId,
      book_title: body.bookTitle.trim(),
      summary,
    };

    const { data, error } = await supabase
      .from('book_discussions' as 'profiles')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Failed to save book discussion:', error);
      return NextResponse.json(
        { error: '독서 토론 기록 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ discussion: data as BookDiscussionRow });
  } catch (error) {
    return handleApiError(error, 'POST /api/book-discussions');
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await withParent(request);
    if (isErrorResponse(session)) return session;

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    const supabase = createAdminClient();

    let query = supabase
      .from('book_discussions' as 'profiles')
      .select('*, profiles!inner(name)')
      .order('discussed_at', { ascending: false });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch book discussions:', error);
      return NextResponse.json(
        { error: '독서 토론 기록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discussions = (data ?? []).map((row: any) => ({
      id: row.id,
      profile_id: row.profile_id,
      book_title: row.book_title,
      summary: row.summary,
      discussed_at: row.discussed_at,
      created_at: row.created_at,
      profile_name: row.profiles?.name ?? '',
    }));

    return NextResponse.json({ discussions });
  } catch (error) {
    return handleApiError(error, 'GET /api/book-discussions');
  }
}

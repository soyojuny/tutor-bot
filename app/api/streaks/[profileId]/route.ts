import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withAuth, isErrorResponse, handleApiError } from '@/lib/api/helpers';
import { DailyStreakRow, SupabaseQueryResult } from '@/lib/supabase/types';
import { updateStreak } from '@/lib/services/streaks';

// GET /api/streaks/[profileId] - 프로필의 연속 달성일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

    const { profileId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const { data: streak, error }: SupabaseQueryResult<DailyStreakRow> = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('profile_id', profileId)
      .eq('family_id', session.familyId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // 연속 달성일이 없으면 기본값 반환
    if (!streak) {
      return NextResponse.json({
        streak_count: 0,
        longest_streak: 0,
        last_activity_date: null,
      });
    }

    return NextResponse.json(streak);
  } catch (error) {
    return handleApiError(error, 'GET /api/streaks/[profileId]');
  }
}

// POST /api/streaks/[profileId] - 연속 달성일 업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const session = await withAuth(request);
    if (isErrorResponse(session)) return session;

    const { profileId } = await params;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const data = await updateStreak(supabase, profileId, session.familyId);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'POST /api/streaks/[profileId]');
  }
}

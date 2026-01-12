import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/streaks/[profileId] - 프로필의 연속 달성일 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    const supabase = await createClient();

    const { data: streak, error } = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('profile_id', profileId)
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
    console.error('[API] Error fetching streak:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak' },
      { status: 500 }
    );
  }
}

// POST /api/streaks/[profileId] - 연속 달성일 업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    const supabase = await createClient();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 기존 연속 달성일 조회
    const { data: existingStreak, error: fetchError } = await supabase
      .from('daily_streaks')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let newStreakCount = 1;
    let newLongestStreak = 1;

    if (existingStreak) {
      const lastDate = new Date(existingStreak.last_activity_date);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // 오늘 이미 업데이트됨 - 변경 없음
        return NextResponse.json(existingStreak);
      } else if (diffDays === 1) {
        // 연속 달성!
        newStreakCount = existingStreak.streak_count + 1;
        newLongestStreak = Math.max(newStreakCount, existingStreak.longest_streak);
      } else {
        // 연속 끊김 - 리셋
        newStreakCount = 1;
        newLongestStreak = existingStreak.longest_streak; // 최장 기록은 유지
      }

      // 기존 레코드 업데이트
      const { data, error } = await supabase
        .from('daily_streaks')
        .update({
          streak_count: newStreakCount,
          longest_streak: newLongestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // 신규 레코드 생성
      const { data, error } = await supabase
        .from('daily_streaks')
        .insert({
          profile_id: profileId,
          streak_count: 1,
          longest_streak: 1,
          last_activity_date: today,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('[API] Error updating streak:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}

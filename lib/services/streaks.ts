import { DailyStreakRow, SupabaseQueryResult } from '@/lib/supabase/types';

/**
 * 연속 달성일 업데이트 (upsert)
 * 오늘 이미 업데이트된 경우 기존 데이터를 반환합니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateStreak(supabase: any, profileId: string, familyId: string, today?: string): Promise<DailyStreakRow | null> {
  const todayStr = today ?? new Date().toISOString().split('T')[0];

  // 기존 연속 달성일 조회
  const { data: existingStreak, error: fetchError }: SupabaseQueryResult<DailyStreakRow> = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('profile_id', profileId)
    .eq('family_id', familyId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  let newStreakCount = 1;
  let newLongestStreak = 1;

  if (existingStreak) {
    const lastDate = new Date(existingStreak.last_activity_date);
    const todayDate = new Date(todayStr);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // 오늘 이미 업데이트됨 - 변경 없음
      return existingStreak;
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
    const { data, error }: SupabaseQueryResult<DailyStreakRow> = await supabase
      .from('daily_streaks')
      .update({
        streak_count: newStreakCount,
        longest_streak: newLongestStreak,
        last_activity_date: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId)
      .eq('family_id', familyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // 신규 레코드 생성
    const { data, error }: SupabaseQueryResult<DailyStreakRow> = await supabase
      .from('daily_streaks')
      .insert({
        profile_id: profileId,
        family_id: familyId,
        streak_count: 1,
        longest_streak: 1,
        last_activity_date: todayStr,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

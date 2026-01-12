'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/shared/Card';
import { Flame, Trophy } from 'lucide-react';
import { DailyStreak } from '@/types';

interface StreakDisplayProps {
  profileId: string;
}

export default function StreakDisplay({ profileId }: StreakDisplayProps) {
  const [streak, setStreak] = useState<DailyStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, [profileId]);

  async function fetchStreak() {
    try {
      const response = await fetch(`/api/streaks/${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setStreak(data);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card padding="md" className="bg-gradient-to-r from-orange-50 to-red-50">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </Card>
    );
  }

  const streakCount = streak?.streak_count || 0;
  const longestStreak = streak?.longest_streak || 0;

  return (
    <Card padding="md" className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">연속 달성일</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-orange-600">{streakCount}</span>
            <span className="text-lg text-gray-600">일</span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 mb-1 justify-end">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-gray-600">최장 기록</span>
          </div>
          <span className="text-xl font-bold text-yellow-600">{longestStreak}일</span>
        </div>
      </div>

      {streakCount >= 3 && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <p className="text-sm text-orange-700 text-center font-medium">
            🔥 {streakCount}일 연속! 정말 멋져요!
          </p>
        </div>
      )}
    </Card>
  );
}

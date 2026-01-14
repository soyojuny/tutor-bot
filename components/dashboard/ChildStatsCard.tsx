'use client';

import { Activity, Profile, PointsTransaction } from '@/types';
import Card from '@/components/shared/Card';
import { Trophy, Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface ChildStatsCardProps {
  child: Profile;
  activities: Activity[];
  balance: number;
  transactions: PointsTransaction[];
}

export default function ChildStatsCard({
  child,
  activities,
  balance,
  transactions,
}: ChildStatsCardProps) {
  // 해당 아이의 활동만 필터링
  const childActivities = activities.filter((a) => a.assigned_to === child.id);

  // 통계 계산
  const stats = {
    total: childActivities.length,
    verified: childActivities.filter((a) => a.status === 'verified').length,
    inProgress: childActivities.filter((a) => a.status === 'in_progress').length,
    completed: childActivities.filter((a) => a.status === 'completed').length,
    pending: childActivities.filter((a) => a.status === 'pending').length,
  };

  // 완료율 계산
  const completionRate = stats.total > 0
    ? Math.round((stats.verified / stats.total) * 100)
    : 0;

  // 총 획득 포인트 (earned 타입만)
  const totalEarned = transactions
    .filter((t) => t.transaction_type === 'earned')
    .reduce((sum, t) => sum + t.points_change, 0);

  // 총 사용 포인트 (spent 타입만)
  const totalSpent = Math.abs(
    transactions
      .filter((t) => t.transaction_type === 'spent')
      .reduce((sum, t) => sum + t.points_change, 0)
  );

  // 평균 포인트 (검증된 활동당)
  const avgPoints = stats.verified > 0
    ? Math.round(totalEarned / stats.verified)
    : 0;

  return (
    <Card padding="lg" className="bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{child.name}</h3>
        <span className="text-sm text-gray-500">{child.age}세</span>
      </div>

      {/* 포인트 현황 */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <div>
          <p className="text-2xl font-bold text-yellow-700">{balance.toLocaleString()}P</p>
          <p className="text-sm text-yellow-600">현재 포인트</p>
        </div>
      </div>

      {/* 활동 통계 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-lg font-semibold text-emerald-700">{stats.verified}</p>
            <p className="text-xs text-emerald-600">완료됨</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Clock className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-lg font-semibold text-blue-700">{stats.inProgress + stats.completed}</p>
            <p className="text-xs text-blue-600">진행중</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Target className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-lg font-semibold text-gray-700">{stats.pending}</p>
            <p className="text-xs text-gray-600">대기중</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <div>
            <p className="text-lg font-semibold text-purple-700">{completionRate}%</p>
            <p className="text-xs text-purple-600">완료율</p>
          </div>
        </div>
      </div>

      {/* 포인트 요약 */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-medium text-green-600">+{totalEarned.toLocaleString()}</p>
            <p className="text-xs text-gray-500">총 획득</p>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">-{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-gray-500">총 사용</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">{avgPoints}</p>
            <p className="text-xs text-gray-500">활동당 평균</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

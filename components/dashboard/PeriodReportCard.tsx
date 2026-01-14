'use client';

import { useState } from 'react';
import { Activity, Profile, PointsTransaction } from '@/types';
import Card from '@/components/shared/Card';
import { Calendar, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { subDays, startOfDay, isAfter, format } from 'date-fns';

interface PeriodReportCardProps {
  activities: Activity[];
  transactions: Record<string, PointsTransaction[]>;
  childProfiles: Profile[];
}

type Period = 'week' | 'month';

export default function PeriodReportCard({
  activities,
  transactions,
  childProfiles,
}: PeriodReportCardProps) {
  const [period, setPeriod] = useState<Period>('week');

  const daysBack = period === 'week' ? 7 : 30;
  const periodStart = startOfDay(subDays(new Date(), daysBack));
  const periodLabel = period === 'week' ? '이번 주' : '이번 달';
  const prevPeriodStart = startOfDay(subDays(new Date(), daysBack * 2));

  // 기간별 활동 필터링
  const periodActivities = activities.filter((a) => {
    const activityDate = new Date(a.created_at);
    return isAfter(activityDate, periodStart);
  });

  const prevPeriodActivities = activities.filter((a) => {
    const activityDate = new Date(a.created_at);
    return isAfter(activityDate, prevPeriodStart) && !isAfter(activityDate, periodStart);
  });

  // 기간별 통계 계산
  const currentStats = {
    total: periodActivities.length,
    verified: periodActivities.filter((a) => a.status === 'verified').length,
  };

  const prevStats = {
    total: prevPeriodActivities.length,
    verified: prevPeriodActivities.filter((a) => a.status === 'verified').length,
  };

  // 변화율 계산
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const activityTrend = getTrend(currentStats.total, prevStats.total);
  const verifiedTrend = getTrend(currentStats.verified, prevStats.verified);

  // 아이별 기간 통계
  const childStats = childProfiles.map((child) => {
    const childActivities = periodActivities.filter((a) => a.assigned_to === child.id);
    const childTransactions = (transactions[child.id] || []).filter((t) => {
      const transactionDate = new Date(t.created_at);
      return isAfter(transactionDate, periodStart);
    });

    const earned = childTransactions
      .filter((t) => t.transaction_type === 'earned')
      .reduce((sum, t) => sum + t.points_change, 0);

    return {
      child,
      activities: childActivities.length,
      verified: childActivities.filter((a) => a.status === 'verified').length,
      earned,
    };
  });

  // 최고 성과자 찾기
  const topPerformer = childStats.reduce(
    (top, curr) => (curr.verified > top.verified ? curr : top),
    childStats[0]
  );

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">기간별 리포트</h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              period === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              period === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            월간
          </button>
        </div>
      </div>

      {/* 기간 표시 */}
      <p className="text-sm text-gray-500 mb-4">
        {format(periodStart, 'yyyy.MM.dd')} ~ {format(new Date(), 'yyyy.MM.dd')} ({periodLabel})
      </p>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600">총 활동</span>
            <div className="flex items-center gap-1">
              <TrendIcon trend={activityTrend} />
              <span className={`text-xs ${activityTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {activityTrend >= 0 ? '+' : ''}{activityTrend}%
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{currentStats.total}개</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-600">완료된 활동</span>
            <div className="flex items-center gap-1">
              <TrendIcon trend={verifiedTrend} />
              <span className={`text-xs ${verifiedTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {verifiedTrend >= 0 ? '+' : ''}{verifiedTrend}%
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{currentStats.verified}개</p>
        </div>
      </div>

      {/* 최고 성과자 */}
      {topPerformer && topPerformer.verified > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg mb-4">
          <Award className="w-6 h-6 text-yellow-500" />
          <div>
            <p className="text-sm text-yellow-700">
              <span className="font-semibold">{topPerformer.child.name}</span>이(가) {periodLabel} 최고 성과!
            </p>
            <p className="text-xs text-yellow-600">
              {topPerformer.verified}개 완료 · {topPerformer.earned.toLocaleString()}P 획득
            </p>
          </div>
        </div>
      )}

      {/* 아이별 요약 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">아이별 요약</h4>
        <div className="space-y-2">
          {childStats.map(({ child, activities, verified, earned }) => (
            <div
              key={child.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <span className="font-medium text-gray-900">{child.name}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">{activities}개 활동</span>
                <span className="text-emerald-600">{verified}개 완료</span>
                <span className="text-yellow-600">+{earned.toLocaleString()}P</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

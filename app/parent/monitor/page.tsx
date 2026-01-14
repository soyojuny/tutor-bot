'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useActivityStore } from '@/store/activityStore';
import { Profile, PointsTransaction } from '@/types';
import Card from '@/components/shared/Card';
import ChildStatsCard from '@/components/dashboard/ChildStatsCard';
import PointsTrendChart from '@/components/dashboard/PointsTrendChart';
import PeriodReportCard from '@/components/dashboard/PeriodReportCard';
import CategoryAnalysisChart from '@/components/dashboard/CategoryAnalysisChart';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';

export default function MonitorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { activities, fetchActivities, isLoading: activitiesLoading } = useActivityStore();

  const [childProfiles, setChildProfiles] = useState<Profile[]>([]);
  const [childBalances, setChildBalances] = useState<Record<string, number>>({});
  const [childTransactions, setChildTransactions] = useState<Record<string, PointsTransaction[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로딩
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    setIsLoading(true);
    try {
      await fetchActivities();
      await fetchChildProfilesAndPoints();
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChildProfilesAndPoints() {
    try {
      // 아이 프로필 조회
      const response = await fetch('/api/profiles?role=child');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 조회 실패');
      }

      // 나이순 정렬 (내림차순)
      const profiles = (data.profiles || []).sort(
        (a: Profile, b: Profile) => (b.age || 0) - (a.age || 0)
      );
      setChildProfiles(profiles);

      // 각 아이의 포인트 잔액 및 거래 내역 조회
      const balances: Record<string, number> = {};
      const transactions: Record<string, PointsTransaction[]> = {};

      for (const profile of profiles) {
        try {
          const pointsResponse = await fetch(`/api/points?profile_id=${profile.id}`);
          if (pointsResponse.ok) {
            const pointsData = await pointsResponse.json();
            balances[profile.id] = pointsData.current_balance || 0;
            transactions[profile.id] = pointsData.transactions || [];
          }
        } catch (err) {
          console.error(`Error fetching points for ${profile.id}:`, err);
          balances[profile.id] = 0;
          transactions[profile.id] = [];
        }
      }

      setChildBalances(balances);
      setChildTransactions(transactions);
    } catch (err) {
      console.error('Error fetching child profiles:', err);
    }
  }

  const handleRefresh = () => {
    loadData();
  };

  if (isLoading || activitiesLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>데이터를 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/parent/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">학습 모니터링</h1>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>

        {/* 아이별 상세 통계 */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">아이별 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childProfiles.map((child) => (
              <ChildStatsCard
                key={child.id}
                child={child}
                activities={activities}
                balance={childBalances[child.id] || 0}
                transactions={childTransactions[child.id] || []}
              />
            ))}
          </div>
        </section>

        {/* 포인트 추이 차트 */}
        <section className="mb-8">
          <Card padding="md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">포인트 획득 추이 (최근 2주)</h2>
            <PointsTrendChart
              transactions={childTransactions}
              childProfiles={childProfiles}
              days={14}
            />
          </Card>
        </section>

        {/* 기간별 리포트 & 카테고리 분석 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PeriodReportCard
            activities={activities}
            transactions={childTransactions}
            childProfiles={childProfiles}
          />
          <CategoryAnalysisChart
            activities={activities}
            childProfiles={childProfiles}
          />
        </div>

        {/* 빠른 링크 */}
        <section className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">빠른 이동</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/parent/dashboard')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors"
            >
              <span className="block text-sm font-medium text-blue-700">대시보드</span>
            </button>
            <button
              onClick={() => router.push('/parent/manage-activities')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors"
            >
              <span className="block text-sm font-medium text-purple-700">활동 관리</span>
            </button>
            <button
              onClick={() => router.push('/parent/manage-rewards')}
              className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg text-center transition-colors"
            >
              <span className="block text-sm font-medium text-amber-700">보상 관리</span>
            </button>
            <button
              onClick={() => router.push('/parent/manage-rewards/redemptions')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors"
            >
              <span className="block text-sm font-medium text-green-700">교환 승인</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

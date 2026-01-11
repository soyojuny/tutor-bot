'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useActivityStore } from '@/store/activityStore';
import { useRewardStore } from '@/store/rewardStore';
import { Profile, Activity } from '@/types';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import PointsDisplay from '@/components/shared/PointsDisplay';
import { Plus, ClipboardList, Gift, BarChart3, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [childProfiles, setChildProfiles] = useState<Profile[]>([]);
  const [childBalances, setChildBalances] = useState<Record<string, number>>({});
  const { activities, fetchActivities } = useActivityStore();
  const { redemptions, fetchRedemptions, rewards, fetchRewards } = useRewardStore();

  // 아이 프로필 목록 및 포인트 조회
  useEffect(() => {
    if (user) {
      fetchChildProfilesAndPoints();
      fetchActivities();
      fetchRedemptions();
      fetchRewards();
    }
  }, [user, fetchActivities, fetchRedemptions, fetchRewards]);

  async function fetchChildProfilesAndPoints() {
    try {
      const supabase = createClient();
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'child')
        .order('age', { ascending: false });

      if (error) throw error;
      setChildProfiles(profiles || []);

      // 각 아이의 포인트 잔액 조회
      const balances: Record<string, number> = {};
      for (const profile of profiles || []) {
        try {
          const response = await fetch(`/api/points?profile_id=${profile.id}`);
          if (response.ok) {
            const data = await response.json();
            balances[profile.id] = data.current_balance || 0;
          }
        } catch (err) {
          console.error(`Error fetching points for ${profile.id}:`, err);
          balances[profile.id] = 0;
        }
      }
      setChildBalances(balances);
    } catch (err) {
      console.error('Error fetching child profiles:', err);
    }
  }

  // 통계 계산
  const stats = {
    totalActivities: activities.length,
    pendingVerification: activities.filter((a) => a.status === 'completed').length,
    verifiedToday: activities.filter((a) => {
      if (a.status !== 'verified' || !a.verified_at) return false;
      const verifiedDate = new Date(a.verified_at).toDateString();
      const today = new Date().toDateString();
      return verifiedDate === today;
    }).length,
    pendingRedemptions: redemptions.filter((r) => r.status === 'pending').length,
  };

  // 최근 활동 목록 (검증 대기 중인 것 우선)
  const recentActivities = [...activities]
    .sort((a, b) => {
      // completed 상태를 우선 표시
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (a.status !== 'completed' && b.status === 'completed') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 5);

  // 최근 보상 교환 요청
  const recentRedemptions = [...redemptions]
    .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
    .slice(0, 5);

  // 날짜 포맷팅
  function formatDate(dateString: string | undefined) {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return null;
    }
  }

  // 보상 정보 가져오기
  function getRewardInfo(rewardId: string) {
    return rewards.find((r) => r.id === rewardId);
  }

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">부모 대시보드</h1>
            <p className="text-gray-600 mt-1">안녕하세요, {user?.name}님!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card
            hoverable
            onClick={() => router.push('/parent/manage-activities')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">활동 관리</h3>
                <p className="text-sm text-gray-600">학습 활동 관리</p>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => router.push('/parent/manage-rewards')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">보상 관리</h3>
                <p className="text-sm text-gray-600">보상 관리</p>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => router.push('/parent/monitor')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">모니터링</h3>
                <p className="text-sm text-gray-600">진행 상황 (예정)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 아이 포인트 표시 */}
        {childProfiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {childProfiles.map((child) => (
              <PointsDisplay
                key={child.id}
                balance={childBalances[child.id] || 0}
                size="md"
              />
            ))}
          </div>
        )}

        {/* 활동 관리 빠른 액션 */}
        <Card padding="md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">활동 관리</h2>
              <p className="text-gray-600">새로운 학습 활동을 만들어보세요</p>
            </div>
            <Button
              onClick={() => router.push('/parent/manage-activities')}
              icon={<Plus className="w-5 h-5" />}
            >
              활동 관리하기
            </Button>
          </div>
        </Card>

        {/* 알림 영역 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-blue-800">
            💡 <strong>Phase 6 완료!</strong> 활동 관리 기능을 사용할 수 있습니다.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            활동 목록 페이지에서 새 활동을 만들고 관리해보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { usePointsStore } from '@/store/pointsStore';
import { useActivityStore } from '@/store/activityStore';
import { useRewardStore } from '@/store/rewardStore';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import PointsDisplay from '@/components/shared/PointsDisplay';
import { ClipboardList, Gift, Trophy, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ChildDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { balance, fetchBalance } = usePointsStore();
  const { activities, fetchActivities } = useActivityStore();
  const { redemptions, fetchRedemptions, rewards, fetchRewards } = useRewardStore();

  useEffect(() => {
    if (user) {
      fetchBalance(user.id);
      fetchActivities();
      fetchRedemptions(user.id);
      fetchRewards();
    }
  }, [user, fetchBalance, fetchActivities, fetchRedemptions]);

  // 내 활동 필터링
  const myActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (!activity.assigned_to || activity.assigned_to === user?.id) {
        return true;
      }
      return false;
    });
  }, [activities, user?.id]);

  // 통계 계산
  const stats = useMemo(() => {
    return {
      total: myActivities.length,
      completed: myActivities.filter((a) => a.status === 'completed' || a.status === 'verified').length,
      inProgress: myActivities.filter((a) => a.status === 'in_progress').length,
      totalPoints: myActivities
        .filter((a) => a.status === 'verified')
        .reduce((sum, a) => sum + a.points_value, 0),
    };
  }, [myActivities]);

  // 최근 활동 목록
  const recentActivities = useMemo(() => {
    return [...myActivities]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [myActivities]);

  // 최근 보상 교환 내역
  const myRedemptions = useMemo(() => {
    return redemptions.filter((r) => r.profile_id === user?.id);
  }, [redemptions, user?.id]);

  const recentRedemptions = useMemo(() => {
    return [...myRedemptions]
      .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
      .slice(0, 3);
  }, [myRedemptions]);

  // 날짜 포맷팅
  function formatDate(dateString: string | undefined) {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'MM-dd HH:mm');
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
            <h1 className="text-4xl font-bold text-gray-800">
              안녕, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2 text-lg">오늘도 열심히 해보자!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* 포인트 표시 */}
        {balance && (
          <div className="mb-6">
            <PointsDisplay balance={balance.current_balance} size="lg" />
          </div>
        )}

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card
            hoverable
            onClick={() => router.push('/child/activities')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClipboardList className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xl">나의 활동</h3>
                <p className="text-sm text-gray-600">할 일 확인하고 완료하기</p>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => router.push('/child/rewards')}
            className="cursor-pointer opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Gift className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xl">보상 교환</h3>
                <p className="text-sm text-gray-600">곧 만들 예정이에요!</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 활동 관리 빠른 액션 */}
        <Card padding="lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">오늘의 활동</h2>
              <p className="text-gray-600 text-lg">
                부모님이 만들어주신 활동을 확인하고 완료해보세요!
              </p>
            </div>
            <Button
              onClick={() => router.push('/child/activities')}
              size="lg"
              icon={<ClipboardList className="w-5 h-5" />}
            >
              활동 보기
            </Button>
          </div>
        </Card>

        {/* 알림 영역 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <p className="text-yellow-800 text-lg">
            💡 <strong>Phase 7 완료!</strong> 활동을 시작하고 완료할 수 있어요!
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            활동 페이지에서 할 일을 확인하고 완료해보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

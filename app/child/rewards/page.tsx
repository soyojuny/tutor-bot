'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRewardStore } from '@/store/rewardStore';
import { usePointsStore } from '@/store/pointsStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RewardCard from '@/components/child/RewardCard';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { RefreshCw, Gift } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorAlert from '@/components/shared/ErrorAlert';

export default function ChildRewardsPage() {
  const { user, isChild } = useAuth();
  const {
    rewards,
    isLoading,
    error,
    fetchRewards,
    redeemReward,
  } = useRewardStore();
  const { balance, fetchBalance } = usePointsStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isChild && user) {
      fetchRewards();
      fetchBalance(user.id);
    }
  }, [isChild, user, fetchRewards, fetchBalance]);

  // 활성화된 보상만 필터링
  const activeRewards = rewards.filter((reward) => reward.is_active);

  // 보상 교환
  async function handleRedeem(rewardId: string) {
    if (!user) return;

    const reward = activeRewards.find((r) => r.id === rewardId);
    if (!reward) return;

    if (balance && balance.current_balance < reward.points_cost) {
      toast.error('포인트가 부족합니다! 😢');
      return;
    }

    if (!confirm(`정말 ${reward.title}을(를) ${reward.points_cost}포인트로 교환하시겠어요?`)) {
      return;
    }

    setActionLoading(rewardId);
    try {
      const redemption = await redeemReward(rewardId, user.id);
      if (redemption) {
        toast.success(`${reward.title} 교환 요청이 완료되었어요! 🎁 부모님이 확인할 거예요.`);
        // 포인트 잔액 새로고침
        await fetchBalance(user.id);
        // 보상 목록 새로고침 (필요 시)
        await fetchRewards();
      } else {
        toast.error('교환 요청에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error redeeming reward:', err);
      toast.error('교환 요청 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  }

  const currentBalance = balance?.current_balance || 0;

  return (
    <ProtectedRoute allowedRoles={['child']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">보상 교환</h1>
            <p className="text-gray-600 mt-2 text-lg">
              포인트로 보상을 받아보세요!
            </p>
          </div>
          <Button
            onClick={() => {
              fetchRewards();
              if (user) fetchBalance(user.id);
            }}
            variant="ghost"
            icon={<RefreshCw className="w-5 h-5" />}
            disabled={isLoading}
          >
            새로고침
          </Button>
        </div>

        {/* 현재 포인트 표시 */}
        <Card padding="md" className="bg-gradient-to-r from-yellow-50 to-pink-50 border-2 border-yellow-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Gift className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">보유 포인트</div>
                <div className="text-3xl font-bold text-gray-900">
                  {currentBalance.toLocaleString()}P
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {activeRewards.length}개의 보상
            </div>
          </div>
        </Card>

        {/* 에러 메시지 */}
        {error && <ErrorAlert message={error} />}

        {/* 로딩 상태 */}
        {isLoading && <LoadingSpinner className="py-12" message="보상 목록을 불러오는 중..." />}

        {/* 보상 목록 */}
        {!isLoading && activeRewards.length === 0 && (
          <Card padding="lg" className="text-center">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-600 text-lg mb-4">
              아직 사용할 수 있는 보상이 없어요!
            </p>
            <p className="text-sm text-gray-500">
              부모님이 보상을 만들어주시면 여기 나타날 거예요.
            </p>
          </Card>
        )}

        {/* 보상 카드 그리드 */}
        {!isLoading && activeRewards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                currentBalance={currentBalance}
                onRedeem={() => handleRedeem(reward.id)}
                isLoading={actionLoading === reward.id}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

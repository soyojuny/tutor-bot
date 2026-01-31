'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRewardStore } from '@/store/rewardStore';
import { RedemptionStatus } from '@/types';
import { REDEMPTION_STATUS_LABELS, REDEMPTION_STATUS_COLORS } from '@/lib/constants/rewards';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { CheckCircle2, XCircle, Gift, RefreshCw, User } from 'lucide-react';
import { formatDate } from '@/lib/utils/dates';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorAlert from '@/components/shared/ErrorAlert';

export default function RewardRedemptionsPage() {
  const { user, isParent } = useAuth();
  const {
    redemptions,
    rewards,
    isLoading,
    error,
    fetchRedemptions,
    fetchRewards,
    updateRedemptionStatus,
  } = useRewardStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isParent && user) {
      fetchRedemptions();
      fetchRewards();
    }
  }, [isParent, user, fetchRedemptions, fetchRewards]);

  // 필터링된 교환 내역
  const filteredRedemptions = redemptions.filter((redemption) => {
    if (selectedStatus !== 'all' && redemption.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // 보상 정보 가져오기
  function getRewardInfo(rewardId: string) {
    return rewards.find((r) => r.id === rewardId);
  }

  // 교환 상태 업데이트
  async function handleUpdateStatus(
    redemptionId: string,
    status: RedemptionStatus
  ) {
    if (!user) return;

    const redemption = redemptions.find((r) => r.id === redemptionId);
    if (!redemption) return;

    const reward = getRewardInfo(redemption.reward_id);
    const rewardTitle = reward?.title || '보상';

    let confirmMessage = '';
    if (status === 'approved') {
      confirmMessage = `${rewardTitle} 교환을 승인하시겠습니까?`;
    } else if (status === 'rejected') {
      confirmMessage = `${rewardTitle} 교환을 거부하시겠습니까? (포인트는 이미 차감되었습니다)`;
    } else if (status === 'fulfilled') {
      confirmMessage = `${rewardTitle} 교환이 완료되었나요?`;
    }

    if (!confirm(confirmMessage)) return;

    setActionLoading(redemptionId);
    try {
      const updatedRedemption = await updateRedemptionStatus(
        redemptionId,
        status,
        status === 'fulfilled' ? user.id : undefined
      );
      if (updatedRedemption) {
        // 교환 내역 새로고침
        await fetchRedemptions();
      }
    } catch (err) {
      console.error('Error updating redemption status:', err);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">보상 교환 관리</h1>
            <p className="text-gray-600 mt-1">
              아이들의 보상 교환 요청을 승인하거나 거부하세요
            </p>
          </div>
          <Button
            onClick={() => fetchRedemptions()}
            variant="ghost"
            icon={<RefreshCw className="w-5 h-5" />}
            disabled={isLoading}
          >
            새로고침
          </Button>
        </div>

        {/* 필터 */}
        <Card padding="md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상태
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-parent-primary"
          >
            <option value="all">전체</option>
            {Object.entries(REDEMPTION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Card>

        {/* 에러 메시지 */}
        {error && <ErrorAlert message={error} />}

        {/* 로딩 상태 */}
        {isLoading && <LoadingSpinner className="py-12" message="교환 내역을 불러오는 중..." />}

        {/* 교환 내역 목록 */}
        {!isLoading && filteredRedemptions.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-gray-600 mb-4">
              {redemptions.length === 0
                ? '교환 요청이 없습니다.'
                : '필터 조건에 맞는 교환 내역이 없습니다.'}
            </p>
          </Card>
        )}

        {/* 교환 내역 카드 목록 */}
        {!isLoading && filteredRedemptions.length > 0 && (
          <div className="space-y-4">
            {filteredRedemptions.map((redemption) => {
              const reward = getRewardInfo(redemption.reward_id);
              const statusColor = REDEMPTION_STATUS_COLORS[redemption.status];
              const statusLabel = REDEMPTION_STATUS_LABELS[redemption.status];

              return (
                <Card key={redemption.id} padding="md" border>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* 보상 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {reward?.icon_emoji || '🎁'}
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {reward?.title || '알 수 없는 보상'}
                          </h3>
                          {reward?.description && (
                            <p className="text-sm text-gray-600">
                              {reward.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>프로필 ID: {redemption.profile_id.substring(0, 8)}...</span>
                        </div>
                        <div>
                          포인트: {redemption.points_spent}P
                        </div>
                        <div>
                          요청: {formatDate(redemption.redeemed_at, 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                    </div>

                    {/* 상태 및 액션 */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                      {redemption.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(redemption.id, 'approved')}
                            disabled={actionLoading === redemption.id}
                            loading={actionLoading === redemption.id}
                            icon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            승인
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleUpdateStatus(redemption.id, 'rejected')}
                            disabled={actionLoading === redemption.id}
                            icon={<XCircle className="w-4 h-4" />}
                          >
                            거부
                          </Button>
                        </div>
                      )}
                      {redemption.status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(redemption.id, 'fulfilled')}
                          disabled={actionLoading === redemption.id}
                          loading={actionLoading === redemption.id}
                          icon={<Gift className="w-4 h-4" />}
                        >
                          완료 처리
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

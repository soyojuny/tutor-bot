'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRewardStore } from '@/store/rewardStore';
import { Reward, RewardCategory } from '@/types';
import { REWARD_CATEGORIES } from '@/lib/constants/rewards';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RewardForm from '@/components/parent/RewardForm';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { Plus, Edit, Trash2, Trophy, CheckCircle2, XCircle, List } from 'lucide-react';

export default function ManageRewardsPage() {
  const { user, isParent } = useAuth();
  const router = useRouter();
  const {
    rewards,
    isLoading,
    error,
    fetchRewards,
    deleteReward,
    updateReward,
  } = useRewardStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    if (isParent && user) {
      fetchRewards();
    }
  }, [isParent, user, fetchRewards]);

  // 필터링된 보상 목록
  const filteredRewards = rewards.filter((reward) => {
    if (showActiveOnly && !reward.is_active) {
      return false;
    }
    if (selectedCategory !== 'all' && reward.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // 보상 삭제
  async function handleDelete(id: string) {
    if (!confirm('이 보상을 삭제하시겠습니까?')) return;

    const success = await deleteReward(id);
    if (success) {
      alert('보상이 삭제되었습니다.');
    }
  }

  // 보상 활성/비활성 토글
  async function handleToggleActive(reward: Reward) {
    const success = await updateReward(reward.id, { is_active: !reward.is_active });
    if (success) {
      // 성공 메시지는 필요 시 추가
    }
  }

  // 카테고리 정보 가져오기
  function getCategoryInfo(category: RewardCategory | null | undefined) {
    if (!category) return REWARD_CATEGORIES[REWARD_CATEGORIES.length - 1];
    return REWARD_CATEGORIES.find((cat) => cat.value === category) || REWARD_CATEGORIES[REWARD_CATEGORIES.length - 1];
  }

  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">보상 관리</h1>
            <p className="text-gray-600 mt-1">
              아이들이 교환할 수 있는 보상을 관리하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push('/parent/manage-rewards/redemptions')}
              icon={<List className="w-5 h-5" />}
            >
              교환 내역
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              새 보상 만들기
            </Button>
          </div>
        </div>

        {/* 필터 */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-parent-primary"
              >
                <option value="all">전체</option>
                {REWARD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="w-4 h-4 text-parent-primary rounded focus:ring-parent-primary"
                />
                <span className="text-sm font-medium text-gray-700">
                  활성화된 보상만 표시
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <Card padding="md" className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parent-primary mx-auto mb-4"></div>
            <p className="text-gray-600">보상 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 보상 목록 */}
        {!isLoading && filteredRewards.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-gray-600 mb-4">
              {rewards.length === 0
                ? '아직 보상이 없습니다. 새 보상을 만들어보세요!'
                : '필터 조건에 맞는 보상이 없습니다.'}
            </p>
            {rewards.length === 0 && (
              <Button onClick={() => setIsFormOpen(true)}>
                새 보상 만들기
              </Button>
            )}
          </Card>
        )}

        {/* 보상 카드 목록 */}
        {!isLoading && filteredRewards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map((reward) => {
              const categoryInfo = getCategoryInfo(reward.category);

              return (
                <Card key={reward.id} padding="md" hoverable border>
                  <div className="space-y-3">
                    {/* 헤더 */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {reward.icon_emoji || categoryInfo.icon}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                            {categoryInfo.label}
                          </span>
                          {!reward.is_active && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              비활성
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {reward.title}
                        </h3>
                      </div>
                    </div>

                    {/* 설명 */}
                    {reward.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {reward.description}
                      </p>
                    )}

                    {/* 정보 */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{reward.points_cost}포인트</span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant={reward.is_active ? 'ghost' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(reward)}
                        icon={reward.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      >
                        {reward.is_active ? '비활성화' : '활성화'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(reward.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 보상 생성 폼 */}
        <RewardForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            fetchRewards();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

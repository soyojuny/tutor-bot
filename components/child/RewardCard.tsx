'use client';

import { Reward } from '@/types';
import { REWARD_CATEGORIES } from '@/lib/constants/rewards';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import { Trophy } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  currentBalance: number;
  onRedeem?: () => void;
  isLoading?: boolean;
}

export default function RewardCard({
  reward,
  currentBalance,
  onRedeem,
  isLoading = false,
}: RewardCardProps) {
  const categoryInfo = REWARD_CATEGORIES.find((cat) => cat.value === reward.category) || REWARD_CATEGORIES[REWARD_CATEGORIES.length - 1];
  const canAfford = currentBalance >= reward.points_cost;

  return (
    <Card padding="lg" hoverable border className="h-full flex flex-col">
      <div className="flex flex-col flex-1 space-y-4">
        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">
              {reward.icon_emoji || categoryInfo.icon}
            </span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800">
              {categoryInfo.label}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {reward.title}
          </h3>
          {reward.description && (
            <p className="text-gray-700 text-lg">
              {reward.description}
            </p>
          )}
        </div>

        {/* 정보 */}
        <div className="space-y-2 text-base">
          <div className="flex items-center gap-2 text-gray-700">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{reward.points_cost}포인트</span>
          </div>
          {!canAfford && (
            <div className="text-sm text-red-600 font-medium">
              포인트가 부족해요 ({currentBalance}P 보유)
            </div>
          )}
          {canAfford && (
            <div className="text-sm text-green-600 font-medium">
              교환 가능해요! ({currentBalance}P 보유)
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-auto pt-4">
          <Button
            onClick={onRedeem}
            disabled={!canAfford || isLoading}
            loading={isLoading}
            size="lg"
            fullWidth
            variant={canAfford ? 'primary' : 'ghost'}
          >
            {canAfford ? '교환하기' : '포인트 부족'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

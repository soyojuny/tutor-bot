'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRewardStore } from '@/store/rewardStore';
import { CreateRewardInput, RewardCategory } from '@/types';
import { REWARD_CATEGORIES, SUGGESTED_REWARD_EMOJIS } from '@/lib/constants/rewards';
import Modal from '@/components/shared/Modal';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';

interface RewardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RewardForm({ isOpen, onClose, onSuccess }: RewardFormProps) {
  const { user } = useAuth();
  const { createReward, error: storeError } = useRewardStore();
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState<CreateRewardInput>({
    title: '',
    description: '',
    points_cost: 50,
    category: 'screen_time',
    icon_emoji: '',
  });

  // 폼 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const reward = await createReward(formData, user.id);
      if (reward) {
        // 폼 초기화
        setFormData({
          title: '',
          description: '',
          points_cost: 50,
          category: 'screen_time',
          icon_emoji: '',
        });
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error creating reward:', err);
    } finally {
      setLoading(false);
    }
  }

  // 모달 닫기 시 폼 초기화
  function handleClose() {
    setFormData({
      title: '',
      description: '',
      points_cost: 50,
      category: 'screen_time',
      icon_emoji: '',
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 보상 만들기"
      description="아이들이 교환할 수 있는 보상을 추가하세요"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button
            type="submit"
            form="reward-form"
            loading={loading}
            disabled={loading || !formData.title.trim() || formData.points_cost <= 0}
          >
            만들기
          </Button>
        </div>
      }
    >
      <form id="reward-form" onSubmit={handleSubmit} className="space-y-4">
        {storeError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{storeError}</p>
          </div>
        )}

        <Input
          label="제목 *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="예: 30분 게임 시간"
          required
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명 (선택)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="보상에 대한 자세한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={formData.category || 'other'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as RewardCategory })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary"
            >
              {REWARD_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="포인트 비용 *"
            type="number"
            value={formData.points_cost}
            onChange={(e) =>
              setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })
            }
            min={1}
            required
            fullWidth
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            아이콘 이모지 (선택)
          </label>
          <div className="space-y-2">
            <Input
              value={formData.icon_emoji || ''}
              onChange={(e) => setFormData({ ...formData, icon_emoji: e.target.value })}
              placeholder="이모지를 입력하거나 아래에서 선택"
              maxLength={2}
              fullWidth
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_REWARD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon_emoji: emoji })}
                  className={`w-10 h-10 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.icon_emoji === emoji
                      ? 'border-parent-primary bg-parent-background'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

import { create } from 'zustand';
import { Reward, CreateRewardInput, UpdateRewardInput, RewardRedemption } from '@/types';

interface RewardState {
  rewards: Reward[];
  redemptions: RewardRedemption[];
  isLoading: boolean;
  error: string | null;
  fetchRewards: () => Promise<void>;
  createReward: (input: CreateRewardInput, createdBy: string) => Promise<Reward | null>;
  updateReward: (id: string, input: UpdateRewardInput) => Promise<Reward | null>;
  deleteReward: (id: string) => Promise<boolean>;
  getRewardById: (id: string) => Reward | undefined;
  getActiveRewards: () => Reward[];
  fetchRedemptions: (profileId?: string) => Promise<void>;
  redeemReward: (rewardId: string, profileId: string) => Promise<RewardRedemption | null>;
  updateRedemptionStatus: (id: string, status: RewardRedemption['status'], fulfilledBy?: string) => Promise<RewardRedemption | null>;
}

export const useRewardStore = create<RewardState>((set, get) => ({
  rewards: [],
  redemptions: [],
  isLoading: false,
  error: null,

  fetchRewards: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/rewards');
      if (!response.ok) {
        throw new Error('보상 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      set({ rewards: data.rewards || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching rewards:', error);
    }
  },

  createReward: async (input: CreateRewardInput, createdBy: string) => {
    set({ error: null });
    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          created_by: createdBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '보상 생성에 실패했습니다.');
      }

      const data = await response.json();
      const newReward = data.reward;

      set((state) => ({
        rewards: [...state.rewards, newReward],
      }));

      return newReward;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '보상 생성 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error creating reward:', error);
      return null;
    }
  },

  updateReward: async (id: string, input: UpdateRewardInput) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '보상 업데이트에 실패했습니다.');
      }

      const data = await response.json();
      const updatedReward = data.reward;

      set((state) => ({
        rewards: state.rewards.map((reward) =>
          reward.id === id ? updatedReward : reward
        ),
      }));

      return updatedReward;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '보상 업데이트 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error updating reward:', error);
      return null;
    }
  },

  deleteReward: async (id: string) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '보상 삭제에 실패했습니다.');
      }

      set((state) => ({
        rewards: state.rewards.filter((reward) => reward.id !== id),
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '보상 삭제 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error deleting reward:', error);
      return false;
    }
  },

  getRewardById: (id: string) => {
    return get().rewards.find((reward) => reward.id === id);
  },

  getActiveRewards: () => {
    return get().rewards.filter((reward) => reward.is_active);
  },

  fetchRedemptions: async (profileId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = profileId
        ? `/api/rewards/redemptions?profile_id=${profileId}`
        : '/api/rewards/redemptions';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('교환 내역을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      set({ redemptions: data.redemptions || [], isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching redemptions:', error);
    }
  },

  redeemReward: async (rewardId: string, profileId: string) => {
    set({ error: null });
    try {
      const response = await fetch('/api/rewards/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reward_id: rewardId,
          profile_id: profileId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '보상 교환에 실패했습니다.');
      }

      const data = await response.json();
      const newRedemption = data.redemption;

      set((state) => ({
        redemptions: [...state.redemptions, newRedemption],
      }));

      return newRedemption;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '보상 교환 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error redeeming reward:', error);
      return null;
    }
  },

  updateRedemptionStatus: async (id: string, status: RewardRedemption['status'], fulfilledBy?: string) => {
    set({ error: null });
    try {
      const response = await fetch(`/api/rewards/redemptions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          fulfilled_by: fulfilledBy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '교환 상태 업데이트에 실패했습니다.');
      }

      const data = await response.json();
      const updatedRedemption = data.redemption;

      set((state) => ({
        redemptions: state.redemptions.map((redemption) =>
          redemption.id === id ? updatedRedemption : redemption
        ),
      }));

      return updatedRedemption;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '교환 상태 업데이트 중 오류가 발생했습니다.';
      set({ error: errorMessage });
      console.error('Error updating redemption status:', error);
      return null;
    }
  },
}));

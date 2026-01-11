import { create } from 'zustand';
import { PointsTransaction, PointsBalance } from '@/types';

interface PointsState {
  balance: PointsBalance | null;
  transactions: PointsTransaction[];
  isLoading: boolean;
  error: string | null;
  fetchBalance: (profileId: string) => Promise<void>;
  getCurrentBalance: () => number;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  balance: null,
  transactions: [],
  isLoading: false,
  error: null,

  fetchBalance: async (profileId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/points?profile_id=${profileId}`);
      if (!response.ok) {
        throw new Error('포인트 정보를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      set({
        balance: {
          profile_id: data.profile_id,
          current_balance: data.current_balance,
        },
        transactions: data.transactions || [],
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching points:', error);
    }
  },

  getCurrentBalance: () => {
    return get().balance?.current_balance || 0;
  },
}));

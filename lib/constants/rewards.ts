import { RewardCategory } from '@/types';

export const REWARD_CATEGORIES: {
  value: RewardCategory;
  label: string;
  icon: string;
}[] = [
  {
    value: 'screen_time',
    label: '스크린 타임',
    icon: '📱',
  },
  {
    value: 'treat',
    label: '간식',
    icon: '🍦',
  },
  {
    value: 'activity',
    label: '활동',
    icon: '🎨',
  },
  {
    value: 'toy',
    label: '장난감',
    icon: '🧸',
  },
  {
    value: 'privilege',
    label: '특권',
    icon: '⭐',
  },
  {
    value: 'other',
    label: '기타',
    icon: '🎁',
  },
];

export const REDEMPTION_STATUS_LABELS = {
  pending: '대기중',
  approved: '승인됨',
  fulfilled: '완료',
  rejected: '거부됨',
} as const;

export const REDEMPTION_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  fulfilled: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const;

export const SUGGESTED_REWARD_EMOJIS = [
  '🎮', '📱', '💻', '🍦', '🍰', '🍕',
  '🎬', '🎨', '⚽', '🎸', '📚', '🧸',
  '⭐', '🏆', '🎁', '😴', '🎉', '🌟',
];

import { ActivityCategory } from '@/types';

export const ACTIVITY_CATEGORIES: {
  value: ActivityCategory;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    value: 'homework',
    label: '숙제',
    icon: '📝',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    value: 'reading',
    label: '독서',
    icon: '📚',
    color: 'bg-green-100 text-green-800',
  },
  {
    value: 'problem-solving',
    label: '문제 풀이',
    icon: '🧮',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    value: 'practice',
    label: '연습',
    icon: '✏️',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    value: 'other',
    label: '기타',
    icon: '📌',
    color: 'bg-gray-100 text-gray-800',
  },
];

export const ACTIVITY_STATUS_LABELS = {
  pending: '대기중',
  in_progress: '진행중',
  completed: '완료',
  verified: '검증됨',
} as const;

export const ACTIVITY_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  verified: 'bg-emerald-100 text-emerald-800',
} as const;

export const DEFAULT_POINTS_BY_CATEGORY: Record<ActivityCategory, number> = {
  homework: 20,
  reading: 10,
  'problem-solving': 15,
  practice: 15,
  other: 10,
};

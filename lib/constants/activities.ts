import { ActivityCategory, ActivityFrequency } from '@/types';
import { getKSTDay } from '@/lib/utils/dates';

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

// 활동 빈도 관련 상수
export const ACTIVITY_FREQUENCIES: {
  value: ActivityFrequency;
  label: string;
  description: string;
}[] = [
  {
    value: 'once',
    label: '한 번',
    description: '일회성 활동',
  },
  {
    value: 'weekdays',
    label: '주중',
    description: '월~금요일 반복',
  },
  {
    value: 'daily',
    label: '매일',
    description: '매일 반복',
  },
];

export const ACTIVITY_FREQUENCY_LABELS: Record<ActivityFrequency, string> = {
  once: '한 번',
  weekdays: '주중',
  daily: '매일',
};

// 주중(weekdays) 요일 정의 (월~금, 0=일요일)
export const WEEKDAYS = [1, 2, 3, 4, 5]; // Monday to Friday

// 오늘이 해당 빈도에 맞는 날인지 확인 (KST 기준)
export function isAvailableToday(frequency: ActivityFrequency): boolean {
  if (frequency === 'once') return true; // 일회성은 항상 가능 (상태로 제어)
  if (frequency === 'daily') return true;
  if (frequency === 'weekdays') {
    const todayKST = getKSTDay(); // KST 기준 요일
    return WEEKDAYS.includes(todayKST);
  }
  return false;
}

// 완료 상태 라벨
export const COMPLETION_STATUS_LABELS = {
  completed: '완료 (검증 대기)',
  verified: '검증됨',
} as const;

export const COMPLETION_STATUS_COLORS = {
  completed: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-emerald-100 text-emerald-800',
} as const;

export function getCategoryInfo(category: ActivityCategory) {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category)
    ?? ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
}

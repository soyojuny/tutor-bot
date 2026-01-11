'use client';

import { Activity, ActivityCategory } from '@/types';
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '@/lib/constants/activities';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import { Trophy, Calendar, CheckCircle2, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityCardProps {
  activity: Activity;
  onStart?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export default function ActivityCard({
  activity,
  onStart,
  onComplete,
  isLoading = false,
}: ActivityCardProps) {
  const categoryInfo = ACTIVITY_CATEGORIES.find((cat) => cat.value === activity.category) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
  const statusColor = ACTIVITY_STATUS_COLORS[activity.status];
  const statusLabel = ACTIVITY_STATUS_LABELS[activity.status];

  // 날짜 포맷팅
  function formatDate(dateString: string | undefined) {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return null;
    }
  }

  // 상태에 따른 버튼 표시
  function renderActionButton() {
    if (activity.status === 'pending') {
      return (
        <Button
          onClick={onStart}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
          fullWidth
          icon={<PlayCircle className="w-5 h-5" />}
        >
          시작하기
        </Button>
      );
    }

    if (activity.status === 'in_progress') {
      return (
        <Button
          onClick={onComplete}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
          fullWidth
          icon={<CheckCircle2 className="w-5 h-5" />}
        >
          완료했어요!
        </Button>
      );
    }

    if (activity.status === 'completed') {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
          <p className="text-yellow-800 font-semibold text-lg">
            ✅ 완료했어요!
          </p>
          <p className="text-sm text-yellow-600 mt-1">
            부모님이 확인할 때까지 기다려주세요
          </p>
        </div>
      );
    }

    if (activity.status === 'verified') {
      return (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold text-lg">
            🎉 검증 완료!
          </p>
          <p className="text-sm text-green-600 mt-1">
            {activity.points_value}포인트를 받았어요!
          </p>
        </div>
      );
    }

    return null;
  }

  return (
    <Card padding="lg" hoverable border className="h-full flex flex-col">
      <div className="flex flex-col flex-1 space-y-4">
        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} ml-auto`}>
              {statusLabel}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {activity.title}
          </h3>
          {activity.description && (
            <p className="text-gray-700 text-lg">
              {activity.description}
            </p>
          )}
        </div>

        {/* 정보 */}
        <div className="space-y-2 text-base">
          <div className="flex items-center gap-2 text-gray-700">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{activity.points_value}포인트</span>
          </div>
          {activity.due_date && (
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>마감: {formatDate(activity.due_date)}</span>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-auto pt-4">
          {renderActionButton()}
        </div>
      </div>
    </Card>
  );
}

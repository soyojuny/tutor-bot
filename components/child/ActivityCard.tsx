'use client';

import { Activity, ActivityWithTodayStatus } from '@/types';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_FREQUENCY_LABELS,
} from '@/lib/constants/activities';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import { Trophy, Calendar, CheckCircle2, PlayCircle, Repeat, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityCardProps {
  activity: Activity | ActivityWithTodayStatus;
  onStart?: () => void;
  onComplete?: () => void;
  onCompleteRepeating?: () => void;
  isLoading?: boolean;
}

export default function ActivityCard({
  activity,
  onStart,
  onComplete,
  onCompleteRepeating,
  isLoading = false,
}: ActivityCardProps) {
  const categoryInfo = ACTIVITY_CATEGORIES.find((cat) => cat.value === activity.category) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
  const statusColor = ACTIVITY_STATUS_COLORS[activity.status];
  const statusLabel = ACTIVITY_STATUS_LABELS[activity.status];

  // 반복 활동인지 확인
  const isRepeating = activity.is_template;
  const hasToday = 'today_completion_count' in activity;
  const todayActivity = hasToday ? (activity as ActivityWithTodayStatus) : null;

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
    // 반복 활동인 경우
    if (isRepeating && todayActivity) {
      const { today_completion_count, can_complete_today, is_available_today, pending_completions } = todayActivity;
      const maxCount = activity.max_daily_count;

      // 오늘 수행할 수 없는 날인 경우 (주중 활동인데 주말인 경우)
      if (!is_available_today) {
        return (
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
            <p className="text-gray-600 font-semibold text-lg">
              📅 오늘은 쉬는 날!
            </p>
            <p className="text-sm text-gray-500 mt-1">
              주중에만 할 수 있는 활동이에요
            </p>
          </div>
        );
      }

      // 검증 대기 중인 완료 기록이 있는 경우
      if (pending_completions.length > 0) {
        return (
          <div className="space-y-2">
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-center">
              <p className="text-yellow-800 font-semibold">
                ⏳ {pending_completions.length}건 검증 대기 중
              </p>
            </div>
            {can_complete_today && (
              <Button
                onClick={onCompleteRepeating}
                disabled={isLoading}
                loading={isLoading}
                size="lg"
                fullWidth
                icon={<RefreshCw className="w-5 h-5" />}
              >
                한 번 더! ({today_completion_count}/{maxCount})
              </Button>
            )}
          </div>
        );
      }

      // 오늘 완료 가능한 경우
      if (can_complete_today) {
        return (
          <Button
            onClick={onCompleteRepeating}
            disabled={isLoading}
            loading={isLoading}
            size="lg"
            fullWidth
            icon={<CheckCircle2 className="w-5 h-5" />}
          >
            {today_completion_count > 0
              ? `한 번 더! (${today_completion_count}/${maxCount})`
              : '완료하기'}
          </Button>
        );
      }

      // 오늘 최대 횟수 도달
      return (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
          <p className="text-green-800 font-semibold text-lg">
            🎉 오늘 완료!
          </p>
          <p className="text-sm text-green-600 mt-1">
            {maxCount}회 모두 완료했어요!
          </p>
        </div>
      );
    }

    // 일회성 활동인 경우 (기존 로직)
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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-2xl">{categoryInfo.icon}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color}`}>
              {categoryInfo.label}
            </span>
            {/* 반복 활동인 경우 빈도 배지 표시 */}
            {isRepeating && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {ACTIVITY_FREQUENCY_LABELS[activity.frequency]}
              </span>
            )}
            {/* 일회성 활동인 경우 상태 배지 표시 */}
            {!isRepeating && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor} ml-auto`}>
                {statusLabel}
              </span>
            )}
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
          {/* 반복 활동인 경우 오늘 진행 상황 표시 */}
          {isRepeating && todayActivity && (
            <div className="flex items-center gap-2 text-gray-700">
              <RefreshCw className="w-5 h-5 text-purple-500" />
              <span>
                오늘: {todayActivity.today_completion_count}/{activity.max_daily_count}회
              </span>
            </div>
          )}
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

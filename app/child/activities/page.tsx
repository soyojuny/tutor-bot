'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStore } from '@/store/activityStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ActivityCard from '@/components/child/ActivityCard';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { RefreshCw, Trophy } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorAlert from '@/components/shared/ErrorAlert';

export default function ChildActivitiesPage() {
  const { user, isChild } = useAuth();
  const {
    todayActivities,
    isLoading,
    error,
    fetchTodayActivities,
    startActivity,
    completeActivity,
    completeRepeatingActivity,
  } = useActivityStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isChild && user) {
      fetchTodayActivities(user.id);
    }
  }, [isChild, user, fetchTodayActivities]);

  // 아이에게 할당된 활동만 필터링 (assigned_to가 해당 아이이거나 null)
  // todayActivities는 이미 assigned_to 필터링이 적용되어 있음
  const relevantActivities = todayActivities;

  // 상태별 필터링
  const filteredActivities = relevantActivities.filter((activity) => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'active') {
      // 반복 활동: can_complete_today 기준
      if (activity.is_template) {
        return activity.can_complete_today;
      }
      // 일회성 활동: pending 또는 in_progress
      return activity.status === 'pending' || activity.status === 'in_progress';
    }
    // 반복 활동은 status 필터링이 다르게 적용됨
    if (activity.is_template) {
      if (selectedStatus === 'pending') return activity.can_complete_today;
      if (selectedStatus === 'completed') return activity.pending_completions.length > 0;
      if (selectedStatus === 'verified') return activity.today_completion_count > 0 && activity.pending_completions.length === 0;
      return true;
    }
    return activity.status === selectedStatus;
  });

  // 활동 시작 (일회성 활동)
  async function handleStart(activityId: string) {
    if (!user) return;
    setActionLoading(activityId);
    try {
      await startActivity(activityId);
      // 활동 목록 새로고침
      await fetchTodayActivities(user.id);
    } catch (err) {
      console.error('Error starting activity:', err);
    } finally {
      setActionLoading(null);
    }
  }

  // 활동 완료 (일회성 활동)
  async function handleComplete(activityId: string) {
    if (!user) return;
    if (!confirm('정말 완료했어요? 완료하면 부모님이 확인할 거예요!')) {
      return;
    }

    setActionLoading(activityId);
    try {
      await completeActivity(activityId);
      // 활동 목록 새로고침
      await fetchTodayActivities(user.id);
    } catch (err) {
      console.error('Error completing activity:', err);
    } finally {
      setActionLoading(null);
    }
  }

  // 반복 활동 완료
  async function handleCompleteRepeating(activityId: string) {
    if (!user) return;
    if (!confirm('이 활동을 완료했나요?')) {
      return;
    }

    setActionLoading(activityId);
    try {
      await completeRepeatingActivity(activityId);
      // 활동 목록 새로고침
      await fetchTodayActivities(user.id);
    } catch (err) {
      console.error('Error completing repeating activity:', err);
    } finally {
      setActionLoading(null);
    }
  }

  // 통계 계산 (반복 활동과 일회성 활동 모두 고려)
  const stats = {
    total: relevantActivities.length,
    pending: relevantActivities.filter((a) => {
      if (a.is_template) return a.can_complete_today;
      return a.status === 'pending';
    }).length,
    inProgress: relevantActivities.filter((a) => !a.is_template && a.status === 'in_progress').length,
    completed: relevantActivities.filter((a) => {
      if (a.is_template) return a.pending_completions.length > 0;
      return a.status === 'completed';
    }).length,
    verified: relevantActivities.filter((a) => {
      if (a.is_template) return a.today_completion_count > 0;
      return a.status === 'verified';
    }).length,
    totalPoints: relevantActivities
      .filter((a) => a.status === 'verified' || (a.is_template && a.today_completion_count > 0))
      .reduce((sum, a) => {
        if (a.is_template) {
          // 반복 활동: 오늘 검증된 횟수 * 포인트
          const verifiedCount = a.today_completion_count - a.pending_completions.length;
          return sum + (verifiedCount > 0 ? verifiedCount * a.points_value : 0);
        }
        return sum + a.points_value;
      }, 0),
  };

  // 새로고침 핸들러
  function handleRefresh() {
    if (user) {
      fetchTodayActivities(user.id);
    }
  }

  return (
    <ProtectedRoute allowedRoles={['child']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">나의 활동</h1>
            <p className="text-gray-600 mt-2 text-lg">
              할 일을 확인하고 완료해보세요!
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            icon={<RefreshCw className="w-5 h-5" />}
            disabled={isLoading}
          >
            새로고침
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="md" className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">전체</div>
          </Card>
          <Card padding="md" className="text-center bg-yellow-50">
            <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
            <div className="text-sm text-yellow-600 mt-1">대기중</div>
          </Card>
          <Card padding="md" className="text-center bg-blue-50">
            <div className="text-3xl font-bold text-blue-700">{stats.inProgress}</div>
            <div className="text-sm text-blue-600 mt-1">진행중</div>
          </Card>
          <Card padding="md" className="text-center bg-green-50">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-green-600" />
              <div className="text-3xl font-bold text-green-700">{stats.totalPoints}</div>
            </div>
            <div className="text-sm text-green-600 mt-1">받은 포인트</div>
          </Card>
        </div>

        {/* 필터 */}
        <Card padding="md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            활동 상태
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-child-primary text-lg"
          >
            <option value="all">전체</option>
            <option value="active">할 일 (대기중 + 진행중)</option>
            <option value="pending">대기중</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료 (검증 대기중)</option>
            <option value="verified">검증 완료</option>
          </select>
        </Card>

        {/* 에러 메시지 */}
        {error && <ErrorAlert message={error} />}

        {/* 로딩 상태 */}
        {isLoading && <LoadingSpinner className="py-12" message="활동 목록을 불러오는 중..." />}

        {/* 활동 목록 */}
        {!isLoading && filteredActivities.length === 0 && (
          <Card padding="lg" className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-600 text-lg mb-4">
              {relevantActivities.length === 0
                ? '아직 활동이 없어요! 부모님이 활동을 만들어주시면 여기 나타날 거예요.'
                : '필터 조건에 맞는 활동이 없어요.'}
            </p>
            {relevantActivities.length > 0 && (
              <Button onClick={() => setSelectedStatus('all')} size="lg">
                전체 보기
              </Button>
            )}
          </Card>
        )}

        {/* 활동 카드 그리드 */}
        {!isLoading && filteredActivities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onStart={() => handleStart(activity.id)}
                onComplete={() => handleComplete(activity.id)}
                onCompleteRepeating={() => handleCompleteRepeating(activity.id)}
                isLoading={actionLoading === activity.id}
              />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStore } from '@/store/activityStore';
import { Activity, ActivityCategory, ActivityCompletion } from '@/types';
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '@/lib/constants/activities';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ActivityForm from '@/components/parent/ActivityForm';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { Plus, Edit, Trash2, Calendar, User, Trophy, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageActivitiesPage() {
  const { user, isParent } = useAuth();
  const router = useRouter();
  const {
    activities,
    pendingCompletions,
    isLoading,
    error,
    fetchActivities,
    fetchPendingCompletions,
    deleteActivity,
    verifyActivity,
    verifyCompletion,
  } = useActivityStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [childProfiles, setChildProfiles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isParent && user) {
      fetchActivities();
      fetchPendingCompletions();
      fetchChildProfiles();
    }
  }, [isParent, user, fetchActivities, fetchPendingCompletions]);

  // 아이 프로필 목록 가져오기
  async function fetchChildProfiles() {
    try {
      const response = await fetch('/api/profiles?role=child');
      const data = await response.json();
      if (response.ok) {
        setChildProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Error fetching child profiles:', err);
    }
  }

  // 아이 이름 가져오기
  function getChildName(profileId: string) {
    const child = childProfiles.find((c) => c.id === profileId);
    return child?.name || '알 수 없음';
  }

  // 활동 제목 가져오기
  function getActivityTitle(activityId: string) {
    const activity = activities.find((a) => a.id === activityId);
    return activity?.title || '알 수 없는 활동';
  }

  // 활동 포인트 가져오기
  function getActivityPoints(activityId: string) {
    const activity = activities.find((a) => a.id === activityId);
    return activity?.points_value || 0;
  }

  // 필터링된 활동 목록
  const filteredActivities = activities.filter((activity) => {
    if (selectedStatus !== 'all' && activity.status !== selectedStatus) {
      return false;
    }
    if (selectedCategory !== 'all' && activity.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // 활동 삭제
  async function handleDelete(id: string) {
    if (!confirm('이 활동을 삭제하시겠습니까?')) return;

    const success = await deleteActivity(id);
    if (success) {
      toast.success('활동이 삭제되었습니다.');
    } else {
      toast.error('활동 삭제에 실패했습니다.');
    }
  }

  // 활동 검증 (개별 할당 일회성 활동)
  async function handleVerify(activityId: string) {
    if (!user) return;
    if (!confirm('이 활동을 검증하고 포인트를 지급하시겠습니까?')) return;

    setActionLoading(activityId);
    try {
      const verifiedActivity = await verifyActivity(activityId, user.id);
      if (verifiedActivity) {
        toast.success(`${verifiedActivity.points_value}포인트가 지급되었습니다! 🎉`);
        // 활동 목록 새로고침
        await fetchActivities();
      } else {
        toast.error('활동 검증에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error verifying activity:', err);
      toast.error('활동 검증 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  }

  // 완료 기록 검증 (반복/전체 대상 활동)
  async function handleVerifyCompletion(completionId: string) {
    if (!user) return;
    if (!confirm('이 완료 기록을 검증하고 포인트를 지급하시겠습니까?')) return;

    setActionLoading(completionId);
    try {
      const verifiedCompletion = await verifyCompletion(completionId);
      if (verifiedCompletion) {
        const points = verifiedCompletion.points_awarded || 0;
        toast.success(`${points}포인트가 지급되었습니다! 🎉`);
        // 목록 새로고침
        await fetchPendingCompletions();
      } else {
        toast.error('완료 기록 검증에 실패했습니다.');
      }
    } catch (err) {
      console.error('Error verifying completion:', err);
      toast.error('완료 기록 검증 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  }

  // 활동 편집
  function handleEdit(activity: Activity) {
    setActivityToEdit(activity);
    setIsFormOpen(true);
  }

  // 날짜 포맷팅
  function formatDate(dateString: string | undefined) {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return null;
    }
  }

  // 카테고리 정보 가져오기
  function getCategoryInfo(category: ActivityCategory) {
    return ACTIVITY_CATEGORIES.find((cat) => cat.value === category) || ACTIVITY_CATEGORIES[ACTIVITY_CATEGORIES.length - 1];
  }

  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">활동 관리</h1>
            <p className="text-gray-600 mt-1">
              아이들의 학습 활동을 관리하세요
            </p>
          </div>
          <Button
            onClick={() => {
              setActivityToEdit(null);
              setIsFormOpen(true);
            }}
            icon={<Plus className="w-5 h-5" />}
          >
            새 활동 만들기
          </Button>
        </div>

        {/* 필터 */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-parent-primary"
              >
                <option value="all">전체</option>
                {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-parent-primary"
              >
                <option value="all">전체</option>
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <Card padding="md" className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* 검증 대기 완료 기록 (반복/전체 대상 활동) */}
        {pendingCompletions.length > 0 && (
          <Card padding="md" className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-yellow-800">
                검증 대기 ({pendingCompletions.length}건)
              </h2>
            </div>
            <div className="space-y-3">
              {pendingCompletions.map((completion) => (
                <div
                  key={completion.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {getActivityTitle(completion.activity_id)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getChildName(completion.profile_id)} · {completion.completed_date} · {getActivityPoints(completion.activity_id)}포인트
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleVerifyCompletion(completion.id)}
                    disabled={actionLoading === completion.id}
                    loading={actionLoading === completion.id}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    검증
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-parent-primary mx-auto mb-4"></div>
            <p className="text-gray-600">활동 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 활동 목록 */}
        {!isLoading && filteredActivities.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-gray-600 mb-4">
              {activities.length === 0
                ? '아직 활동이 없습니다. 새 활동을 만들어보세요!'
                : '필터 조건에 맞는 활동이 없습니다.'}
            </p>
            {activities.length === 0 && (
              <Button onClick={() => setIsFormOpen(true)}>
                새 활동 만들기
              </Button>
            )}
          </Card>
        )}

        {/* 활동 카드 목록 */}
        {!isLoading && filteredActivities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((activity) => {
              const categoryInfo = getCategoryInfo(activity.category);
              const statusColor = ACTIVITY_STATUS_COLORS[activity.status];
              const statusLabel = ACTIVITY_STATUS_LABELS[activity.status];

              return (
                <Card key={activity.id} padding="md" hoverable border>
                  <div className="space-y-3">
                    {/* 헤더 */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {activity.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.icon} {categoryInfo.label}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 설명 */}
                    {activity.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {/* 정보 */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{activity.points_value}포인트</span>
                      </div>
                      {activity.due_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>마감: {formatDate(activity.due_date)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          생성: {formatDate(activity.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2 border-t">
                      {/* 개별 할당 일회성 활동만 직접 검증 가능 (전체 대상/반복은 위 검증 대기에서) */}
                      {activity.status === 'completed' && activity.assigned_to && !activity.is_template && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleVerify(activity.id)}
                          disabled={actionLoading === activity.id}
                          loading={actionLoading === activity.id}
                          icon={<CheckCircle2 className="w-4 h-4" />}
                          className="flex-1"
                        >
                          검증하기
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                        icon={<Edit className="w-4 h-4" />}
                      >
                        편집
                      </Button>
                      {activity.status !== 'verified' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          icon={<Trash2 className="w-4 h-4" />}
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 활동 생성/수정 폼 */}
        <ActivityForm
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setActivityToEdit(null);
          }}
          onSuccess={() => {
            fetchActivities();
            setActivityToEdit(null);
          }}
          activityToEdit={activityToEdit || undefined}
        />
      </div>
    </ProtectedRoute>
  );
}

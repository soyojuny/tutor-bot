'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStore } from '@/store/activityStore';
import { Activity, ActivityCategory } from '@/types';
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '@/lib/constants/activities';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ActivityForm from '@/components/parent/ActivityForm';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { Plus, Edit, Trash2, Calendar, User, Trophy } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageActivitiesPage() {
  const { user, isParent } = useAuth();
  const router = useRouter();
  const {
    activities,
    isLoading,
    error,
    fetchActivities,
    deleteActivity,
  } = useActivityStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isParent && user) {
      fetchActivities();
    }
  }, [isParent, user, fetchActivities]);

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
      // 성공 메시지 (추후 토스트로 변경 가능)
      alert('활동이 삭제되었습니다.');
    }
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
            onClick={() => setIsFormOpen(true)}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: 편집 기능 (Phase 6 확장 또는 Phase 7)
                          alert('편집 기능은 곧 추가됩니다.');
                        }}
                        icon={<Edit className="w-4 h-4" />}
                      >
                        편집
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(activity.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* 활동 생성 폼 */}
        <ActivityForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            fetchActivities();
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

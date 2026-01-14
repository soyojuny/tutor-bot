'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStore } from '@/store/activityStore';
import { Activity, CreateActivityInput, Profile, ActivityCategory, ActivityFrequency } from '@/types';
import { ACTIVITY_CATEGORIES, DEFAULT_POINTS_BY_CATEGORY, ACTIVITY_FREQUENCIES } from '@/lib/constants/activities';
import Modal from '@/components/shared/Modal';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  activityToEdit?: Activity;
}

export default function ActivityForm({ isOpen, onClose, onSuccess, activityToEdit }: ActivityFormProps) {
  const { user } = useAuth();
  const { createActivity, updateActivity, error: storeError } = useActivityStore();
  const [loading, setLoading] = useState(false);
  const [childProfiles, setChildProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // 모드 감지
  const isEditMode = !!activityToEdit;

  // 초기값 설정 함수
  function getInitialFormData(): CreateActivityInput {
    if (activityToEdit) {
      return {
        title: activityToEdit.title,
        description: activityToEdit.description || '',
        category: activityToEdit.category,
        points_value: activityToEdit.points_value,
        assigned_to: activityToEdit.assigned_to,
        due_date: activityToEdit.due_date,
        frequency: activityToEdit.frequency || 'once',
        max_daily_count: activityToEdit.max_daily_count || 1,
      };
    }
    return {
      title: '',
      description: '',
      category: 'homework',
      points_value: DEFAULT_POINTS_BY_CATEGORY.homework,
      assigned_to: undefined,
      due_date: undefined,
      frequency: 'once',
      max_daily_count: 1,
    };
  }

  // 폼 상태
  const [formData, setFormData] = useState<CreateActivityInput>(getInitialFormData());

  // 아이 프로필 목록 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchChildProfiles();
    }
  }, [isOpen]);

  // activityToEdit 변경 시 폼 리셋
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityToEdit, isOpen]);

  async function fetchChildProfiles() {
    setLoadingProfiles(true);
    try {
      const response = await fetch('/api/profiles?role=child');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 조회 실패');
      }

      // 나이순 정렬 (내림차순)
      const sortedProfiles = (data.profiles || []).sort(
        (a: Profile, b: Profile) => (b.age || 0) - (a.age || 0)
      );
      setChildProfiles(sortedProfiles);
    } catch (err) {
      console.error('Error fetching child profiles:', err);
    } finally {
      setLoadingProfiles(false);
    }
  }

  // 카테고리 변경 시 기본 포인트 값 업데이트
  function handleCategoryChange(category: ActivityCategory) {
    setFormData({
      ...formData,
      category,
      points_value: DEFAULT_POINTS_BY_CATEGORY[category],
    });
  }

  // 폼 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (isEditMode && activityToEdit) {
        // 수정 모드
        const updated = await updateActivity(activityToEdit.id, formData);
        if (updated) {
          onSuccess?.();
          onClose();
        }
      } else {
        // 생성 모드
        const activity = await createActivity(formData, user.id);
        if (activity) {
          // 폼 초기화
          setFormData({
            title: '',
            description: '',
            category: 'homework',
            points_value: DEFAULT_POINTS_BY_CATEGORY.homework,
            assigned_to: undefined,
            due_date: undefined,
            frequency: 'once',
            max_daily_count: 1,
          });
          onSuccess?.();
          onClose();
        }
      }
    } catch (err) {
      console.error('활동 저장 실패:', err);
    } finally {
      setLoading(false);
    }
  }

  // 모달 닫기 시 폼 초기화
  function handleClose() {
    setFormData({
      title: '',
      description: '',
      category: 'homework',
      points_value: DEFAULT_POINTS_BY_CATEGORY.homework,
      assigned_to: undefined,
      due_date: undefined,
      frequency: 'once',
      max_daily_count: 1,
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? '활동 수정' : '새 활동 만들기'}
      description={isEditMode ? '활동 정보를 수정하세요' : '아이들에게 할 활동을 추가하세요'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button
            type="submit"
            form="activity-form"
            loading={loading}
            disabled={loading || !formData.title.trim()}
          >
            {isEditMode ? '수정하기' : '만들기'}
          </Button>
        </div>
      }
    >
      <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
        {storeError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{storeError}</p>
          </div>
        )}

        <Input
          label="제목 *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="예: 수학 문제집 10페이지"
          required
          fullWidth
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명 (선택)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="활동에 대한 자세한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value as ActivityCategory)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary"
              required
            >
              {ACTIVITY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="포인트 *"
            type="number"
            value={formData.points_value}
            onChange={(e) =>
              setFormData({ ...formData, points_value: parseInt(e.target.value) || 0 })
            }
            min={1}
            required
            fullWidth
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              할당 대상 (선택)
            </label>
            <select
              value={formData.assigned_to || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assigned_to: e.target.value || undefined,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loadingProfiles || (isEditMode && activityToEdit?.status === 'in_progress')}
            >
              <option value="">전체</option>
              {childProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.age}세)
                </option>
              ))}
            </select>
            {loadingProfiles && (
              <p className="text-xs text-gray-500 mt-1">로딩 중...</p>
            )}
            {isEditMode && activityToEdit?.status === 'in_progress' && (
              <p className="text-xs text-gray-500 mt-1">진행 중인 활동은 배정을 변경할 수 없습니다.</p>
            )}
          </div>

          <Input
            label="마감일 (선택)"
            type="date"
            value={formData.due_date || ''}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value || undefined })
            }
            fullWidth
          />
        </div>

        {/* 빈도 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              반복 빈도
            </label>
            <select
              value={formData.frequency || 'once'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency: e.target.value as ActivityFrequency,
                  // 일회성이면 max_daily_count를 1로 리셋
                  max_daily_count: e.target.value === 'once' ? 1 : formData.max_daily_count,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary"
            >
              {ACTIVITY_FREQUENCIES.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label} - {freq.description}
                </option>
              ))}
            </select>
          </div>

          {/* 반복 활동일 때만 최대 횟수 표시 */}
          {formData.frequency !== 'once' && (
            <Input
              label="하루 최대 횟수"
              type="number"
              value={formData.max_daily_count || 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_daily_count: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
              min={1}
              max={10}
              fullWidth
            />
          )}
        </div>

        {formData.frequency !== 'once' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              이 활동은 <strong>{ACTIVITY_FREQUENCIES.find(f => f.value === formData.frequency)?.label}</strong> 반복되며,
              하루에 최대 <strong>{formData.max_daily_count || 1}회</strong> 수행할 수 있습니다.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActivityStore } from '@/store/activityStore';
import { CreateActivityInput, Profile, ActivityCategory } from '@/types';
import { ACTIVITY_CATEGORIES, DEFAULT_POINTS_BY_CATEGORY } from '@/lib/constants/activities';
import Modal from '@/components/shared/Modal';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import { createClient } from '@/lib/supabase/client';

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ActivityForm({ isOpen, onClose, onSuccess }: ActivityFormProps) {
  const { user } = useAuth();
  const { createActivity, error: storeError } = useActivityStore();
  const [loading, setLoading] = useState(false);
  const [childProfiles, setChildProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // 폼 상태
  const [formData, setFormData] = useState<CreateActivityInput>({
    title: '',
    description: '',
    category: 'homework',
    points_value: DEFAULT_POINTS_BY_CATEGORY.homework,
    assigned_to: undefined,
    due_date: undefined,
  });

  // 아이 프로필 목록 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchChildProfiles();
    }
  }, [isOpen]);

  async function fetchChildProfiles() {
    setLoadingProfiles(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'child')
        .order('age', { ascending: false });

      if (error) throw error;
      setChildProfiles(data || []);
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
        });
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error('Error creating activity:', err);
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
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="새 활동 만들기"
      description="아이들에게 할 활동을 추가하세요"
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
            만들기
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:border-parent-primary"
              disabled={loadingProfiles}
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
      </form>
    </Modal>
  );
}

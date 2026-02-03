'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import AvatarPicker from '@/components/shared/AvatarPicker';

interface ProfileItem {
  id: string;
  name: string;
  role: 'parent' | 'child';
  age: number | null;
  avatar_url: string | null;
  has_pin: boolean;
  family_id: string;
}

interface ProfileForm {
  name: string;
  role: 'parent' | 'child';
  age: string;
  pin: string;
  remove_pin: boolean;
  avatar_url: string;
}

const emptyForm: ProfileForm = {
  name: '',
  role: 'child',
  age: '',
  pin: '',
  remove_pin: false,
  avatar_url: '',
};

export default function ProfileManagePage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isParent } = useAuth();

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/profiles', { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isParent) {
      router.push('/profiles');
      return;
    }
    fetchProfiles();
  }, [isAuthenticated, isParent, router, fetchProfiles]);

  function startEdit(profile: ProfileItem) {
    setEditingId(profile.id);
    setIsCreating(false);
    setForm({
      name: profile.name,
      role: profile.role,
      age: profile.age?.toString() || '',
      pin: '',
      remove_pin: false,
      avatar_url: profile.avatar_url || '',
    });
    setError('');
  }

  function startCreate() {
    setIsCreating(true);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
    setError('');
  }

  async function handleSave() {
    setError('');
    if (!form.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        // 새 프로필 생성 (아이만)
        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            role: 'child',
            age: form.age ? parseInt(form.age) : null,
            pin: form.pin || undefined,
            avatar_url: form.avatar_url || null,
          }),
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '생성 실패');
        }
      } else if (editingId) {
        // 프로필 수정
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body: Record<string, any> = {
          name: form.name.trim(),
          age: form.age ? parseInt(form.age) : null,
          avatar_url: form.avatar_url || null,
        };
        if (form.pin) body.pin = form.pin;
        if (form.remove_pin) body.remove_pin = true;

        const response = await fetch(`/api/profiles/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '수정 실패');
        }
      }

      cancelEdit();
      await fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 프로필을 삭제하시겠습니까? 관련 데이터도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '삭제 실패');
      }

      await fetchProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/profiles')}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">프로필 관리</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* 프로필 목록 */}
        <div className="space-y-3 mb-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  avatarUrl={profile.avatar_url}
                  role={profile.role}
                  size="sm"
                />
                <div>
                  <div className="font-semibold text-gray-800">{profile.name}</div>
                  <div className="text-sm text-gray-500">
                    {profile.role === 'parent' ? '부모' : '아이'}
                    {profile.age && ` · ${profile.age}세`}
                    {profile.has_pin && ' · PIN 설정됨'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(profile)}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id, profile.name)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 버튼 */}
        {!isCreating && !editingId && (
          <button
            onClick={startCreate}
            className="w-full bg-white rounded-lg shadow-sm p-4 flex items-center justify-center gap-2 text-blue-500 hover:bg-blue-50 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            아이 프로필 추가
          </button>
        )}

        {/* 추가/수정 폼 */}
        {(isCreating || editingId) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {isCreating ? '아이 프로필 추가' : '프로필 수정'}
            </h2>

            <div className="space-y-4">
              {/* 아바타 선택 */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setAvatarPickerOpen(true)}
                  className="relative group"
                >
                  <ProfileAvatar
                    avatarUrl={form.avatar_url || null}
                    role={form.role}
                    size="lg"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">변경</span>
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="이름 입력"
                />
              </div>

              {/* 역할 표시 (읽기 전용) */}
              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    역할
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                    {form.role === 'parent' ? '부모' : '아이'}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  나이 (선택)
                </label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="나이"
                  min={1}
                  max={99}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isCreating ? 'PIN (선택, 4자리)' : '새 PIN (변경 시, 4자리)'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => setForm({
                    ...form,
                    pin: e.target.value.replace(/\D/g, ''),
                    remove_pin: false,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="••••"
                />
                {editingId && (
                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.remove_pin}
                      onChange={(e) => setForm({
                        ...form,
                        remove_pin: e.target.checked,
                        pin: e.target.checked ? '' : form.pin,
                      })}
                    />
                    PIN 제거
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelEdit}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {saving ? '저장중...' : '저장'}
              </button>
            </div>

            <AvatarPicker
              currentAvatar={form.avatar_url || null}
              onSelect={(url) => setForm({ ...form, avatar_url: url })}
              isOpen={avatarPickerOpen}
              onClose={() => setAvatarPickerOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

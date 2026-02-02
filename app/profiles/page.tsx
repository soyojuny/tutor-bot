'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';

interface ProfileItem {
  id: string;
  name: string;
  role: 'parent' | 'child';
  age: number | null;
  avatar_url: string | null;
  has_pin: boolean;
  family_id: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { selectProfile, isAuthenticated, fullLogout } = useAuthStore();

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/profiles', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) {
        // Google 세션 없음 → 로그인 페이지로
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(data.error || '프로필 조회 실패');
      }

      const sortedProfiles = (data.profiles || []).sort(
        (a: ProfileItem, _b: ProfileItem) => (a.role === 'parent' ? -1 : 1)
      );
      setProfiles(sortedProfiles);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // 이미 프로필 선택 완료됨
    if (isAuthenticated) {
      // 이미 선택된 경우 대시보드로
      const user = useAuthStore.getState().currentUser;
      if (user) {
        router.push(user.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
        return;
      }
    }

    // Google 세션 확인 후 프로필 목록 가져오기
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      fetchProfiles();
    };
    init();
  }, [isAuthenticated, router, fetchProfiles]);

  async function handleProfileSelect(profile: ProfileItem) {
    setError('');

    if (profile.has_pin) {
      setSelectedProfile(profile);
      setPin('');
      return;
    }

    // PIN 없는 프로필: 바로 선택
    const success = await selectProfile(profile.id);
    if (success) {
      router.push(profile.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
    } else {
      setError('프로필 선택에 실패했습니다.');
    }
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedProfile) return;

    if (pin.length !== 4) {
      setError('PIN은 4자리 숫자입니다.');
      return;
    }

    const success = await selectProfile(selectedProfile.id, pin);
    if (success) {
      router.push(selectedProfile.role === 'parent' ? '/parent/dashboard' : '/child/dashboard');
    } else {
      setError('PIN이 올바르지 않습니다.');
      setPin('');
    }
  }

  async function handleFullLogout() {
    await fullLogout();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tutor Bot</h1>
          <p className="text-gray-600">프로필을 선택하세요</p>
        </div>

        {!selectedProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br flex items-center justify-center text-4xl
                    ${profile.role === 'parent' ? 'from-blue-100 to-blue-200' : 'from-yellow-100 to-yellow-200'}">
                    {profile.role === 'parent' ? '👨' : '👦'}
                  </div>
                  <div className="font-semibold text-gray-800 text-lg">
                    {profile.name}
                  </div>
                  {profile.age && (
                    <div className="text-sm text-gray-500 mt-1">{profile.age}세</div>
                  )}
                  {profile.has_pin && (
                    <div className="text-xs text-gray-400 mt-2">PIN 필요</div>
                  )}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div className="flex justify-center gap-4 mt-6">
              {profiles.some(p => p.role === 'parent') && (
                <button
                  onClick={() => router.push('/profiles/manage')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  프로필 관리
                </button>
              )}
              <button
                onClick={handleFullLogout}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <button
              onClick={() => setSelectedProfile(null)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← 다른 사람 선택
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-2">
                {selectedProfile.role === 'parent' ? '👨' : '👦'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedProfile.name}
              </h2>
            </div>

            <form onSubmit={handlePinSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN 번호 (4자리)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="••••"
                autoFocus
              />

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                  selectedProfile.role === 'parent'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-yellow-400 hover:bg-yellow-500'
                }`}
              >
                확인
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

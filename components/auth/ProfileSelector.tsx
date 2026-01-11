'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function ProfileSelector() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false }); // Parent first

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedProfile) {
      setError('프로필을 선택해주세요.');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN은 4자리 숫자입니다.');
      return;
    }

    const success = await login(selectedProfile.id, pin);

    if (success) {
      // Redirect based on role
      if (selectedProfile.role === 'parent') {
        router.push('/parent/dashboard');
      } else {
        router.push('/child/dashboard');
      }
    } else {
      setError('PIN이 올바르지 않습니다.');
      setPin('');
    }
  }

  function handleProfileSelect(profile: Profile) {
    setSelectedProfile(profile);
    setPin('');
    setError('');
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 Tutor Bot</h1>
          <p className="text-gray-600">학습 관리 앱</p>
        </div>

        {!selectedProfile ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              누구세요?
            </h2>
            <div className="space-y-3">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className={`w-full p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    profile.role === 'parent'
                      ? 'border-parent-primary hover:bg-parent-background'
                      : 'border-child-primary hover:bg-child-background'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">
                      {profile.role === 'parent' ? '👨‍👩' : profile.age === 10 ? '🧒' : '👧'}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">
                        {profile.name}
                      </div>
                      {profile.age && (
                        <div className="text-sm text-gray-500">{profile.age}세</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
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
                {selectedProfile.role === 'parent' ? '👨‍👩' : selectedProfile.age === 10 ? '🧒' : '👧'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedProfile.name}
              </h2>
            </div>

            <form onSubmit={handleLogin}>
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
                    ? 'bg-parent-primary hover:bg-blue-600'
                    : 'bg-child-primary hover:bg-yellow-500'
                }`}
              >
                로그인
              </button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
              <p className="font-semibold mb-1">테스트용 PIN:</p>
              <p>부모: 1234 | 큰아이: 0000 | 작은아이: 1111</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

export default function ChildSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [removePin, setRemovePin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;

    // PIN 제거 요청
    if (removePin) {
      setLoading(true);
      try {
        const response = await fetch(`/api/profiles/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ remove_pin: true }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'PIN 제거에 실패했습니다.');
        }

        setSuccess('PIN이 제거되었습니다.');
        setRemovePin(false);
        // 세션 새로고침을 위해 페이지 리로드
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'PIN 제거에 실패했습니다.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // PIN 설정/변경 요청
    if (!newPin) {
      setError('새 PIN을 입력해주세요.');
      return;
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError('PIN은 4자리 숫자여야 합니다.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PIN이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin: newPin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'PIN 설정에 실패했습니다.');
      }

      setSuccess('PIN이 설정되었습니다.');
      setNewPin('');
      setConfirmPin('');
      // 세션 새로고침을 위해 페이지 리로드
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/child/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">설정</h1>
        </div>

        {/* 프로필 정보 */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b">
          <ProfileAvatar
            avatarUrl={user?.avatar_url}
            role="child"
            size="lg"
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-500">내 프로필</p>
          </div>
        </div>

        {/* PIN 설정 섹션 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">PIN 설정</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            PIN을 설정하면 프로필 선택 시 PIN을 입력해야 합니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* PIN 제거 옵션 */}
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={removePin}
                onChange={(e) => {
                  setRemovePin(e.target.checked);
                  if (e.target.checked) {
                    setNewPin('');
                    setConfirmPin('');
                  }
                }}
                className="w-5 h-5 rounded text-yellow-500 focus:ring-yellow-400"
              />
              <span className="text-gray-700">PIN 제거하기</span>
            </label>

            {!removePin && (
              <>
                {/* 새 PIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    새 PIN (4자리 숫자)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 pr-12"
                      placeholder="••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* PIN 확인 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN 확인
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-400 pr-12"
                      placeholder="••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading || (!removePin && !newPin)}
              className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-yellow-400 hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : removePin ? 'PIN 제거' : 'PIN 저장'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

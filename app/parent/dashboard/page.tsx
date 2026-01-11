'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ParentDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">부모 대시보드</h1>
            <p className="text-gray-600 mt-1">안녕하세요, {user?.name}님!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            🚧 대시보드가 구현되는 중입니다...
          </p>
          <p className="text-sm text-blue-600 mt-2">
            Phase 10에서 완성될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

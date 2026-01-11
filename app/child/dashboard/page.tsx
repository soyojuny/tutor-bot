'use client';

import { useAuth } from '@/hooks/useAuth';

export default function ChildDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              안녕, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">오늘도 열심히 해보자!</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-lg">
            🚧 대시보드가 만들어지는 중이야...
          </p>
          <p className="text-sm text-yellow-600 mt-2">
            조금만 기다려줘! 곧 완성될 거야!
          </p>
        </div>
      </div>
    </div>
  );
}

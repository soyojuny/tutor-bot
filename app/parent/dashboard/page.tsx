'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Button from '@/components/shared/Button';
import Card from '@/components/shared/Card';
import { Plus, ClipboardList, Gift, BarChart3 } from 'lucide-react';

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

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

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card
            hoverable
            onClick={() => router.push('/parent/manage-activities')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">활동 관리</h3>
                <p className="text-sm text-gray-600">학습 활동 관리</p>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => router.push('/parent/manage-rewards')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">보상 관리</h3>
                <p className="text-sm text-gray-600">보상 설정 (예정)</p>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => router.push('/parent/monitor')}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">모니터링</h3>
                <p className="text-sm text-gray-600">진행 상황 (예정)</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 활동 관리 빠른 액션 */}
        <Card padding="md">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">활동 관리</h2>
              <p className="text-gray-600">새로운 학습 활동을 만들어보세요</p>
            </div>
            <Button
              onClick={() => router.push('/parent/manage-activities')}
              icon={<Plus className="w-5 h-5" />}
            >
              활동 관리하기
            </Button>
          </div>
        </Card>

        {/* 알림 영역 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-blue-800">
            💡 <strong>Phase 6 완료!</strong> 활동 관리 기능을 사용할 수 있습니다.
          </p>
          <p className="text-sm text-blue-600 mt-2">
            활동 목록 페이지에서 새 활동을 만들고 관리해보세요.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Activity, Profile } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ACTIVITY_CATEGORIES } from '@/lib/constants/activities';
import Card from '@/components/shared/Card';
import EmptyState from '../shared/EmptyState';

interface CategoryAnalysisChartProps {
  activities: Activity[];
  childProfiles: Profile[];
}

// 카테고리별 색상
const CATEGORY_COLORS: Record<string, string> = {
  homework: '#3B82F6', // blue
  reading: '#10B981', // green
  'problem-solving': '#8B5CF6', // purple
  practice: '#F59E0B', // orange
  other: '#6B7280', // gray
};

export default function CategoryAnalysisChart({
  activities,
  childProfiles,
}: CategoryAnalysisChartProps) {
  // 카테고리별 통계 계산
  const categoryData = ACTIVITY_CATEGORIES.map((category) => {
    const categoryActivities = activities.filter((a) => a.category === category.value);
    const verified = categoryActivities.filter((a) => a.status === 'verified').length;
    const total = categoryActivities.length;
    const totalPoints = categoryActivities
      .filter((a) => a.status === 'verified')
      .reduce((sum, a) => sum + a.points_value, 0);

    return {
      name: category.label,
      value: category.value,
      total,
      verified,
      completionRate: total > 0 ? Math.round((verified / total) * 100) : 0,
      totalPoints,
      icon: category.icon,
    };
  }).filter((data) => data.total > 0);

  // 아이별 카테고리 선호도
  const childCategoryPreferences = childProfiles.map((child) => {
    const childActivities = activities.filter((a) => a.assigned_to === child.id);
    const categoryCount: Record<string, number> = {};

    childActivities.forEach((a) => {
      categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCount).reduce(
      (top, [category, count]) => (count > top.count ? { category, count } : top),
      { category: '', count: 0 }
    );

    const categoryInfo = ACTIVITY_CATEGORIES.find((c) => c.value === topCategory.category);

    return {
      child,
      topCategory: categoryInfo?.label || '-',
      topCategoryIcon: categoryInfo?.icon || '',
      totalActivities: childActivities.length,
    };
  });

  if (categoryData.length === 0) {
    return (
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 분석</h3>
        <EmptyState message="아직 활동 데이터가 없습니다." height="256px" />
      </Card>
    );
  }

  // 파이 차트용 데이터
  const pieData = categoryData.map((d) => ({
    name: `${d.icon} ${d.name}`,
    value: d.verified,
  }));

  return (
    <Card padding="lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 분석</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파이 차트 */}
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CATEGORY_COLORS[entry.value] || '#6B7280'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}개 완료`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 상세 통계 */}
        <div className="space-y-3">
          {categoryData.map((data) => (
            <div
              key={data.value}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{data.icon}</span>
                <span className="font-medium text-gray-900">{data.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">{data.total}개</span>
                <span className="text-emerald-600">{data.verified}개 완료</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    data.completionRate >= 70
                      ? 'bg-green-100 text-green-700'
                      : data.completionRate >= 40
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {data.completionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 아이별 선호 카테고리 */}
      <div className="border-t mt-6 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">아이별 선호 카테고리</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {childCategoryPreferences.map(({ child, topCategory, topCategoryIcon, totalActivities }) => (
            <div
              key={child.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg"
            >
              <span className="font-medium text-gray-900">{child.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">{topCategoryIcon}</span>
                <span className="text-sm text-gray-600">{topCategory}</span>
                <span className="text-xs text-gray-400">({totalActivities}개)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

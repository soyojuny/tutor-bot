'use client';

import { Activity } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ACTIVITY_CATEGORIES } from '@/lib/constants/activities';
import EmptyState from '../shared/EmptyState';

interface ActivityStatsChartProps {
  activities: Activity[];
}

export default function ActivityStatsChart({ activities }: ActivityStatsChartProps) {
  // 카테고리별 활동 수 계산
  const categoryData = ACTIVITY_CATEGORIES.map((category) => {
    const categoryActivities = activities.filter((a) => a.category === category.value);
    const completed = categoryActivities.filter((a) => a.status === 'verified').length;
    const inProgress = categoryActivities.filter((a) => a.status === 'in_progress' || a.status === 'completed').length;
    const pending = categoryActivities.filter((a) => a.status === 'pending').length;

    return {
      name: category.label,
      완료: completed,
      진행중: inProgress,
      대기중: pending,
    };
  }).filter((data) => data.완료 > 0 || data.진행중 > 0 || data.대기중 > 0); // 데이터가 있는 카테고리만

  if (categoryData.length === 0) {
    return (
      <EmptyState message="아직 활동 데이터가 없습니다." height="256px" />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="완료" fill="#10B981" />
        <Bar dataKey="진행중" fill="#F59E0B" />
        <Bar dataKey="대기중" fill="#6B7280" />
      </BarChart>
    </ResponsiveContainer>
  );
}

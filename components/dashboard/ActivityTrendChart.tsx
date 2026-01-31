'use client';

import { Activity } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import EmptyState from '../shared/EmptyState';

interface ActivityTrendChartProps {
  activities: Activity[];
  days?: number;
}

export default function ActivityTrendChart({ activities, days = 7 }: ActivityTrendChartProps) {
  // 최근 N일 데이터 생성
  const trendData = Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const dayLabel = format(date, 'MM/dd');

    const dayActivities = activities.filter((a) => {
      const activityDate = startOfDay(new Date(a.created_at));
      return activityDate.getTime() === date.getTime();
    });

    const completed = dayActivities.filter((a) => a.status === 'verified').length;
    const created = dayActivities.length;

    return {
      date: dayLabel,
      생성됨: created,
      완료됨: completed,
    };
  });

  if (trendData.every((data) => data.생성됨 === 0 && data.완료됨 === 0)) {
    return (
      <EmptyState message={`최근 ${days}일 동안 활동 데이터가 없습니다.`} height="256px" />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="생성됨" stroke="#8B5CF6" strokeWidth={2} />
        <Line type="monotone" dataKey="완료됨" stroke="#10B981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

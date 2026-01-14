'use client';

import { PointsTransaction, Profile } from '@/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface PointsTrendChartProps {
  transactions: Record<string, PointsTransaction[]>; // profile_id -> transactions
  childProfiles: Profile[];
  days?: number;
}

// 아이별 색상
const CHILD_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function PointsTrendChart({
  transactions,
  childProfiles,
  days = 14,
}: PointsTrendChartProps) {
  // 최근 N일 데이터 생성
  const trendData = Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const dayLabel = format(date, 'MM/dd');

    const dayData: Record<string, number | string> = { date: dayLabel };

    childProfiles.forEach((child) => {
      const childTransactions = transactions[child.id] || [];

      // 해당 날짜의 획득 포인트 합계
      const dayEarned = childTransactions
        .filter((t) => {
          const transactionDate = startOfDay(new Date(t.created_at));
          return transactionDate.getTime() === date.getTime() && t.transaction_type === 'earned';
        })
        .reduce((sum, t) => sum + t.points_change, 0);

      dayData[child.name] = dayEarned;
    });

    return dayData;
  });

  // 데이터가 없는지 확인
  const hasData = trendData.some((day) =>
    childProfiles.some((child) => (day[child.name] as number) > 0)
  );

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        최근 {days}일 동안 포인트 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value) => [`${value}P`, '']}
          labelStyle={{ fontWeight: 'bold' }}
        />
        <Legend />
        {childProfiles.map((child, index) => (
          <Area
            key={child.id}
            type="monotone"
            dataKey={child.name}
            stroke={CHILD_COLORS[index % CHILD_COLORS.length]}
            fill={CHILD_COLORS[index % CHILD_COLORS.length]}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

'use client';

import { Trophy } from 'lucide-react';
import Card from './Card';
import { useAuth } from '@/hooks/useAuth';

interface PointsDisplayProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function PointsDisplay({ balance, size = 'md', className, label }: PointsDisplayProps) {
  const { user } = useAuth();
  const role = user?.role || 'child';

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // 역할별 스타일링
  const bgColor = role === 'child' ? 'bg-yellow-100' : 'bg-blue-100';
  const iconColor = role === 'child' ? 'text-yellow-600' : 'text-blue-600';

  return (
    <Card padding="md" className={className}>
      <div className="flex items-center gap-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Trophy className={`${iconSizes[size]} ${iconColor}`} />
        </div>
        <div>
          <div className="text-sm text-gray-600">{label ? `${label}의 포인트` : '포인트'}</div>
          <div className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
            {balance.toLocaleString()}P
          </div>
        </div>
      </div>
    </Card>
  );
}

'use client';

import { Trophy } from 'lucide-react';
import Card from './Card';

interface PointsDisplayProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PointsDisplay({ balance, size = 'md', className }: PointsDisplayProps) {
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

  return (
    <Card padding="md" className={className}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Trophy className={`${iconSizes[size]} text-yellow-600`} />
        </div>
        <div>
          <div className="text-sm text-gray-600">포인트</div>
          <div className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
            {balance.toLocaleString()}P
          </div>
        </div>
      </div>
    </Card>
  );
}

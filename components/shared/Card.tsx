'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import { CardProps } from './types';

export default function Card({
  children,
  header,
  footer,
  padding = 'md',
  shadow = 'md',
  border = false,
  hoverable = false,
  className,
  onClick,
}: CardProps) {
  const { user } = useAuth();
  const role = user?.role || 'parent';

  // 패딩 스타일
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };

  // 그림자 스타일
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-2xl'
  };

  // 역할별 호버 효과
  const hoverStyles = hoverable
    ? role === 'parent'
      ? 'hover:shadow-xl hover:border-parent-primary cursor-pointer transition-all duration-200'
      : 'hover:shadow-xl hover:border-child-primary cursor-pointer transition-all duration-200'
    : '';

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg',
        shadowStyles[shadow],
        border && 'border-2 border-gray-200',
        hoverStyles,
        className
      )}
    >
      {header && (
        <div className={cn(
          'border-b border-gray-200',
          paddingStyles[padding]
        )}>
          {header}
        </div>
      )}

      <div className={paddingStyles[padding]}>
        {children}
      </div>

      {footer && (
        <div className={cn(
          'border-t border-gray-200',
          paddingStyles[padding]
        )}>
          {footer}
        </div>
      )}
    </Component>
  );
}

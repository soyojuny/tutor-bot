'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import { ButtonProps } from './types';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const { user } = useAuth();
  const role = user?.role || 'parent';

  // 역할별 variant 색상 매핑
  const variantStyles = {
    primary: role === 'parent'
      ? 'bg-parent-primary hover:bg-blue-600 text-white'
      : 'bg-child-primary hover:bg-yellow-500 text-gray-900',
    secondary: role === 'parent'
      ? 'bg-parent-secondary hover:bg-purple-600 text-white'
      : 'bg-child-secondary hover:bg-pink-600 text-white',
    outline: role === 'parent'
      ? 'border-2 border-parent-primary text-parent-primary hover:bg-parent-background'
      : 'border-2 border-child-primary text-child-primary hover:bg-child-background',
    ghost: role === 'parent'
      ? 'text-parent-primary hover:bg-parent-background'
      : 'text-child-primary hover:bg-child-background',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  // 크기별 스타일
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  // 기본 스타일
  const baseStyles = 'rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const focusRingColor = role === 'parent' ? 'focus:ring-parent-primary' : 'focus:ring-child-primary';

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        focusRingColor,
        fullWidth && 'w-full',
        (disabled || loading) && 'hover:shadow-none',
        !disabled && !loading && 'hover:shadow-md active:scale-95',
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </span>
    </button>
  );
}

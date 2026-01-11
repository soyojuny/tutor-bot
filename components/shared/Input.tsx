'use client';

import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import { forwardRef } from 'react';
import { InputProps } from './types';

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      inputSize = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const { user } = useAuth();
    const role = user?.role || 'parent';

    // 역할별 포커스 색상
    const focusColor = role === 'parent' ? 'focus:border-parent-primary' : 'focus:border-child-primary';
    const errorColor = 'border-red-500 focus:border-red-500';

    // 크기별 스타일
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-3',
      lg: 'px-5 py-4 text-lg'
    };

    const baseStyles = 'border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100';

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              baseStyles,
              sizeStyles[inputSize],
              error ? errorColor : focusColor,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {!error && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

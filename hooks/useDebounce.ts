'use client';

import { useState, useEffect } from 'react';

/**
 * 값 변경을 지연시키는 디바운스 훅
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const checkSession = useAuthStore((state) => state.checkSession);
  const isSessionChecked = useAuthStore((state) => state.isSessionChecked);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!isSessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}

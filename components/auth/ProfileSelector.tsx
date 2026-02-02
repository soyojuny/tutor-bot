'use client';

/**
 * @deprecated 이 컴포넌트는 더 이상 사용되지 않습니다.
 * Netflix 스타일 인증 시스템으로 전환되어 /profiles 페이지가 대체합니다.
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileSelector() {
  const router = useRouter();

  useEffect(() => {
    router.push('/profiles');
  }, [router]);

  return null;
}

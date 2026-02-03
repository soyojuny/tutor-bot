'use client';

import Image from 'next/image';

interface ProfileAvatarProps {
  avatarUrl: string | null | undefined;
  role: 'parent' | 'child';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 'w-10 h-10', text: 'text-xl', imgSize: 40 },
  md: { container: 'w-16 h-16', text: 'text-3xl', imgSize: 64 },
  lg: { container: 'w-20 h-20', text: 'text-4xl', imgSize: 80 },
};

export default function ProfileAvatar({ avatarUrl, role, size = 'md', className = '' }: ProfileAvatarProps) {
  const { container, text, imgSize } = sizeMap[size];
  const bgGradient = role === 'parent'
    ? 'from-blue-100 to-blue-200'
    : 'from-yellow-100 to-yellow-200';

  if (avatarUrl) {
    return (
      <div className={`${container} rounded-full overflow-hidden bg-gradient-to-br ${bgGradient} flex items-center justify-center ${className}`}>
        <Image
          src={avatarUrl}
          alt="프로필 아바타"
          width={imgSize}
          height={imgSize}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${container} rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center ${text} ${className}`}>
      {role === 'parent' ? '👨' : '👦'}
    </div>
  );
}

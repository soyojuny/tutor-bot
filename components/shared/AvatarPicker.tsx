'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { AVATARS } from '@/lib/constants/avatars';

interface AvatarPickerProps {
  currentAvatar: string | null | undefined;
  onSelect: (avatarUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarPicker({ currentAvatar, onSelect, isOpen, onClose }: AvatarPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">프로필 사진 선택</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => {
                onSelect(avatar.src);
                onClose();
              }}
              className={`p-2 rounded-xl transition-all hover:scale-105 ${
                currentAvatar === avatar.src
                  ? 'ring-3 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-100'
              }`}
              title={avatar.label}
            >
              <Image
                src={avatar.src}
                alt={avatar.label}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Image from 'next/image';
import { AVATAR_CATEGORIES } from '@/lib/constants/avatars';

interface AvatarPickerProps {
  currentAvatar: string | null | undefined;
  onSelect: (avatarUrl: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarPicker({ currentAvatar, onSelect, isOpen, onClose }: AvatarPickerProps) {
  const [activeCategory, setActiveCategory] = useState(AVATAR_CATEGORIES[0].id);
  const category = AVATAR_CATEGORIES.find((c) => c.id === activeCategory) ?? AVATAR_CATEGORIES[0];

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

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4">
          {AVATAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
          {category.avatars.map((avatar) => (
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

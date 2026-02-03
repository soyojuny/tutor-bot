'use client';

import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  useSettingsStore,
  MIN_VAD_THRESHOLD,
  MAX_VAD_THRESHOLD,
} from '@/store/settingsStore';

export default function VadThresholdSlider() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { vadThreshold, setVadThreshold } = useSettingsStore();

  // Convert threshold value to slider percentage (0-100)
  const sliderValue =
    ((vadThreshold - MIN_VAD_THRESHOLD) /
      (MAX_VAD_THRESHOLD - MIN_VAD_THRESHOLD)) *
    100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const newThreshold =
      MIN_VAD_THRESHOLD +
      (percent / 100) * (MAX_VAD_THRESHOLD - MIN_VAD_THRESHOLD);
    setVadThreshold(newThreshold);
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2 text-gray-600">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">마이크 감도 설정</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>민감 (작은소리)</span>
              <span>둔감 (큰소리만)</span>
            </div>
          </div>

          {/* Help Text */}
          <div className="flex gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              말이 잘 안 잡히면 민감하게, 배경소음이 잡히면 둔감하게 설정하세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

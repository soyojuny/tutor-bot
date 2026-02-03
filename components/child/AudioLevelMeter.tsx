'use client';

import { Mic, MicOff, Loader2, Clock } from 'lucide-react';

export type MicState = 'waiting' | 'ready' | 'transmitting' | 'error';

export interface AudioDebugInfo {
  currentRms: number;
  normalizedLevel: number; // 0-100 for UI
  isAboveThreshold: boolean;
  totalChunksSent: number;
  isTransmitting: boolean;
}

interface AudioLevelMeterProps {
  micState: MicState;
  debugInfo: AudioDebugInfo;
  vadThreshold?: number;
  showDebug?: boolean;
}

const MIC_STATE_CONFIG: Record<
  MicState,
  { label: string; bgColor: string; textColor: string; icon: React.ReactNode }
> = {
  waiting: {
    label: 'AI 선생님이 말할 때까지 대기 중...',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: <Clock className="w-4 h-4" />,
  },
  ready: {
    label: '마이크 준비됨 - 말해보세요!',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: <Mic className="w-4 h-4" />,
  },
  transmitting: {
    label: '음성 전송 중...',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  error: {
    label: '마이크 오류',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: <MicOff className="w-4 h-4" />,
  },
};

export default function AudioLevelMeter({
  micState,
  debugInfo,
  vadThreshold = 0.015,
  showDebug = false,
}: AudioLevelMeterProps) {
  const config = MIC_STATE_CONFIG[micState];

  // Normalize threshold to percentage (0-100 scale)
  // RMS typically ranges from 0 to ~0.3 for normal speech
  const maxRms = 0.1; // Reasonable max for visualization
  const thresholdPercent = Math.min((vadThreshold / maxRms) * 100, 100);

  // Level bar color changes based on whether above threshold
  const levelBarColor = debugInfo.isAboveThreshold
    ? 'bg-green-500'
    : 'bg-gray-300';

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-3 space-y-2">
      {/* Status Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Level Bar */}
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
        {/* Level fill */}
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-75 ${levelBarColor}`}
          style={{ width: `${Math.min(debugInfo.normalizedLevel, 100)}%` }}
        />

        {/* Threshold indicator line */}
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500"
          style={{ left: `${thresholdPercent}%` }}
        />

        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-xs pointer-events-none">
          <span className="text-gray-500">조용</span>
          <span className="text-gray-500">큰 소리</span>
        </div>
      </div>

      {/* Threshold label */}
      <div
        className="relative text-xs text-red-500"
        style={{ paddingLeft: `calc(${thresholdPercent}% - 12px)` }}
      >
        ↑ 임계값
      </div>

      {/* Debug Info (development mode only) */}
      {showDebug && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 font-mono space-y-1">
          <div>RMS: {debugInfo.currentRms.toFixed(6)}</div>
          <div>Chunks: {debugInfo.totalChunksSent}</div>
          <div>
            Above Threshold: {debugInfo.isAboveThreshold ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </div>
  );
}

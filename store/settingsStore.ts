import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  vadThreshold: number;
  setVadThreshold: (value: number) => void;
}

const DEFAULT_VAD_THRESHOLD = 0.015;
const MIN_VAD_THRESHOLD = 0.005;
const MAX_VAD_THRESHOLD = 0.05;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vadThreshold: DEFAULT_VAD_THRESHOLD,
      setVadThreshold: (value: number) =>
        set({
          vadThreshold: Math.max(
            MIN_VAD_THRESHOLD,
            Math.min(MAX_VAD_THRESHOLD, value)
          ),
        }),
    }),
    {
      name: 'book-discussion-settings',
    }
  )
);

export { DEFAULT_VAD_THRESHOLD, MIN_VAD_THRESHOLD, MAX_VAD_THRESHOLD };

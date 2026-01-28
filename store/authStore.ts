import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '@/types';

interface AuthState {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionChecked: boolean;
  login: (profileId: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setCurrentUser: (user: Profile | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      isSessionChecked: false,

      login: async (profileId: string, pin: string) => {
        try {
          set({ isLoading: true });

          // 서버 API로 로그인 요청 (세션 쿠키 설정됨)
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId, pin }),
            credentials: 'include',
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            console.error('Login failed:', data.error);
            set({ isLoading: false });
            return false;
          }

          // 로그인 성공
          set({
            currentUser: data.user,
            isAuthenticated: true,
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          // 서버 API로 로그아웃 요청 (세션 쿠키 삭제)
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            currentUser: null,
            isAuthenticated: false,
          });
        }
      },

      checkSession: async () => {
        try {
          set({ isLoading: true });

          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              set({
                currentUser: data.user,
                isAuthenticated: true,
                isLoading: false,
                isSessionChecked: true,
              });
              return;
            }
          }

          // 세션 없음 또는 만료
          set({
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            isSessionChecked: true,
          });
        } catch (error) {
          console.error('Session check error:', error);
          set({
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            isSessionChecked: true,
          });
        }
      },

      setCurrentUser: (user: Profile | null) => {
        set({
          currentUser: user,
          isAuthenticated: user !== null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

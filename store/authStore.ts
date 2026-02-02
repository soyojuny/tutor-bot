import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, Account } from '@/types';

interface AuthState {
  currentUser: Profile | null;
  account: Account | null;
  familyId: string | null;
  isAuthenticated: boolean;
  isGoogleAuthenticated: boolean;
  isLoading: boolean;
  isSessionChecked: boolean;
  selectProfile: (profileId: string, pin?: string) => Promise<boolean>;
  switchProfile: () => Promise<void>;
  fullLogout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setAccount: (account: Account | null) => void;
  setCurrentUser: (user: Profile | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      account: null,
      familyId: null,
      isAuthenticated: false,
      isGoogleAuthenticated: false,
      isLoading: false,
      isSessionChecked: false,

      selectProfile: async (profileId: string, pin?: string) => {
        try {
          set({ isLoading: true });

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

          set({
            currentUser: data.user,
            familyId: data.familyId,
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

      switchProfile: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'switch-profile' }),
            credentials: 'include',
          });
        } catch (error) {
          console.error('Switch profile error:', error);
        } finally {
          set({
            currentUser: null,
            isAuthenticated: false,
            // Keep account and familyId — Google session is still active
          });
        }
      },

      fullLogout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'full' }),
            credentials: 'include',
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            currentUser: null,
            account: null,
            familyId: null,
            isAuthenticated: false,
            isGoogleAuthenticated: false,
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
                familyId: data.familyId,
                isAuthenticated: true,
                isLoading: false,
                isSessionChecked: true,
              });
              return;
            }
          }

          // 프로필 세션 없음 — Google 세션은 미들웨어가 관리
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

      setAccount: (account: Account | null) => {
        set({
          account,
          isGoogleAuthenticated: account !== null,
        });
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
        account: state.account,
        familyId: state.familyId,
        isAuthenticated: state.isAuthenticated,
        isGoogleAuthenticated: state.isGoogleAuthenticated,
      }),
    }
  )
);

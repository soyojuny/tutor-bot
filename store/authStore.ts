import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { verifyPin } from '@/lib/utils/auth';

interface AuthState {
  currentUser: Profile | null;
  isAuthenticated: boolean;
  login: (profileId: string, pin: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: Profile | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,

      login: async (profileId: string, pin: string) => {
        try {
          const supabase = createClient();

          // Fetch profile by ID
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

          if (error || !profile) {
            console.error('Profile not found:', error);
            return false;
          }

          // Verify PIN using bcrypt
          // Check if PIN is hashed (starts with $2a$ or $2b$) or plain text
          const isHashed = profile.pin_code.startsWith('$2a$') || profile.pin_code.startsWith('$2b$');

          let isPinValid = false;
          if (isHashed) {
            // Use bcrypt to verify hashed PIN
            isPinValid = await verifyPin(pin, profile.pin_code);
          } else {
            // Fallback to plain text comparison for backward compatibility
            // TODO: Migrate all PINs to hashed format
            isPinValid = profile.pin_code === pin;
          }

          if (!isPinValid) {
            console.error('Invalid PIN');
            return false;
          }

          // Set authenticated user
          set({
            currentUser: profile,
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

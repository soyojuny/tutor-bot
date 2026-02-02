import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const {
    currentUser,
    account,
    familyId,
    isAuthenticated,
    isGoogleAuthenticated,
    isLoading,
    selectProfile,
    switchProfile,
    fullLogout,
    checkSession,
  } = useAuthStore();

  return {
    user: currentUser,
    account,
    familyId,
    isAuthenticated,
    isGoogleAuthenticated,
    isLoading,
    isParent: currentUser?.role === 'parent',
    isChild: currentUser?.role === 'child',
    selectProfile,
    switchProfile,
    fullLogout,
    checkSession,
  };
}

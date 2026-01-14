import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { currentUser, isAuthenticated, isLoading, login, logout, checkSession } = useAuthStore();

  return {
    user: currentUser,
    isAuthenticated,
    isLoading,
    isParent: currentUser?.role === 'parent',
    isChild: currentUser?.role === 'child',
    login,
    logout,
    checkSession,
  };
}

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { currentUser, isAuthenticated, login, logout } = useAuthStore();

  return {
    user: currentUser,
    isAuthenticated,
    isParent: currentUser?.role === 'parent',
    isChild: currentUser?.role === 'child',
    login,
    logout,
  };
}

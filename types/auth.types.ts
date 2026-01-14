export type UserRole = 'parent' | 'child';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  age: number | null;
  avatar_url: string | null;
  pin_code: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  profileId: string;
  pin: string;
}

export interface AuthState {
  currentUser: Profile | null;
  isAuthenticated: boolean;
}

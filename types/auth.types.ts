export type UserRole = 'parent' | 'child';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  age: number | null;
  avatar_url: string | null;
  pin_code: string | null;
  family_id: string;
  created_at: string;
  updated_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface LoginCredentials {
  profileId: string;
  pin?: string;
}

export interface AuthState {
  currentUser: Profile | null;
  isAuthenticated: boolean;
}

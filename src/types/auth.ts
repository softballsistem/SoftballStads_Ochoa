import type { Permission } from '../config/roles';

export interface User {
  uid: string;
  email: string;
  username: string;
  role: 'developer' | 'admin' | 'player' | 'visitor';
  playerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error?: string; data?: unknown }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string; data?: unknown }>;
  signInWithGoogle: () => Promise<{ error?: string; data?: unknown }>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<{ error?: string }>;
  hasPermission: (requiredPermission: Permission) => boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  role: 'developer' | 'admin' | 'player' | 'visitor';
  player_id: string;
  created_at: string;
  updated_at: string;
}

export interface SignInCredentials {
  emailOrUsername: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  data?: unknown;
  error?: string;
}
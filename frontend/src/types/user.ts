export type UserRole = 'user' | 'admin' | 'moderator';

export interface UserProfile {
  uid: string;
  firebase_uid?: string;
  email: string | null;
  displayName?: string | null;
  name?: string | null;
  photoURL?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  xp?: number;
  level?: number;
  tier?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  total_posts?: number;
  total_likes_received?: number;
  hasNotification?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  unreadAchievements?: number;
}

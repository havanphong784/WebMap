import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

export type DbClient = PoolClient;

export interface QueryRunner {
  query<R extends QueryResultRow = QueryResultRow, I extends unknown[] = unknown[]>(
    queryText: string,
    values?: I,
  ): Promise<QueryResult<R>>;
}

export interface DatabaseConfig {
  connectionString?: string;
  ssl?: {
    rejectUnauthorized?: boolean;
    ca?: string[];
  };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface UserRecord {
  id?: number;
  firebase_uid: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  xp?: number;
  level?: number;
  tier?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  last_seen_at?: string | Date | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: unknown;
}

export interface UserProfile extends UserRecord {
  total_posts?: number | string;
  total_likes_received?: number | string;
}

export type ActiveUser = Pick<
  UserRecord,
  | 'firebase_uid'
  | 'name'
  | 'avatar_url'
  | 'last_seen_at'
  | 'level'
  | 'tier'
  | 'current_lat'
  | 'current_lng'
>;
export type UpsertUserParams = {
  uid: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};
export type UserLocationInput = { lat?: number | string | null; lng?: number | string | null };

export interface FollowRecord {
  id?: number;
  follower_id: string;
  followed_id: string;
  created_at?: string | Date;
  [key: string]: unknown;
}
export type ToggleFollowResult = { followed: boolean };
export type FollowUser = Pick<
  UserRecord,
  'firebase_uid' | 'name' | 'avatar_url' | 'xp' | 'level' | 'tier'
>;
export interface FriendUser extends FollowUser {
  email: string | null;
  last_seen_at: string | Date | null;
  current_lat: number | null;
  current_lng: number | null;
  friends_since: string | Date;
}

export type ToggleLikeParams = { userId: string; locationId: string | number };
export type ToggleLikeResult = { action: 'liked' | 'unliked' };

export type CreateCommentParams = { locationId: string | number; userId: string; content: string };
export interface CommentRecord {
  id: number;
  user_id: string;
  location_id: number;
  content: string;
  created_at: string | Date;
  updated_at?: string | Date;
  [key: string]: unknown;
}
export interface CommentWithAuthor extends CommentRecord {
  name: string | null;
  avatar_url: string | null;
  xp?: number;
  level?: number;
  tier?: string;
}

export interface NotificationRecord {
  id: number;
  recipient_id: string;
  sender_id: string;
  type: string;
  message: string;
  location_id: number | null;
  is_read: boolean;
  created_at: string | Date;
  [key: string]: unknown;
}
export interface EnrichedNotification extends NotificationRecord {
  sender_name: string | null;
  sender_avatar: string | null;
  sender_xp: number | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
}
export type CreateNotificationParams = {
  recipientId: string;
  senderId: string;
  type: string;
  message: string;
  locationId?: string | number | null;
};

export interface AchievementProgress {
  id: number;
  code?: string;
  name: string;
  description: string;
  icon?: string | null;
  category: string;
  requirement_type: string;
  requirement_value: number;
  reward_xp: number;
  current_progress: number;
  is_unlocked: boolean;
  unlocked_at: string | Date | null;
  [key: string]: unknown;
}

export interface DailyTaskProgress {
  id: number;
  code?: string;
  name: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  reward_xp: number;
  current_progress: number;
  is_completed: boolean;
  completed_at: string | Date | null;
  [key: string]: unknown;
}

export interface DirectMessageRecord {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string | Date;
  [key: string]: unknown;
}

export interface ConversationMessage extends DirectMessageRecord {
  sender_name: string | null;
  sender_avatar_url: string | null;
}

export interface MessageThread {
  peer_id: string;
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string | Date;
  unread_count: number;
  peer_name: string | null;
  peer_email: string | null;
  peer_avatar_url: string | null;
  peer_last_seen_at: string | Date | null;
  peer_current_lat: number | null;
  peer_current_lng: number | null;
  [key: string]: unknown;
}

export interface DirectMessagePayload extends DirectMessageRecord {
  peer_id_for_sender: string;
  peer_id_for_recipient: string;
}

export type SendDirectMessageParams = {
  senderId: string;
  recipientId: string;
  content: string;
};

export type ListConversationParams = {
  userId: string;
  peerId: string;
  limit?: number | string;
};

export type ListMessageThreadsParams = {
  userId: string;
};

export type MarkConversationReadParams = {
  userId: string;
  peerId: string;
};

export type EnsureFriendsParams = {
  userId: string;
  peerId: string;
};

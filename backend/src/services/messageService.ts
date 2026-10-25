import pool from '../config/db.js';
import type { AppError } from '../types/common.js';
import type {
  ConversationMessage,
  DirectMessagePayload,
  DirectMessageRecord,
  EnsureFriendsParams,
  ListConversationParams,
  ListMessageThreadsParams,
  MarkConversationReadParams,
  MessageThread,
  SendDirectMessageParams,
} from '../types/database.js';
import { sendToUser } from './sseService.js';

export type {
  ConversationMessage,
  DirectMessagePayload,
  DirectMessageRecord,
  EnsureFriendsParams,
  ListConversationParams,
  ListMessageThreadsParams,
  MarkConversationReadParams,
  MessageThread,
  SendDirectMessageParams,
};

const sanitizeMessage = (content: unknown): string => {
  if (typeof content !== 'string') return '';
  return content.trim().replace(/\s+/g, ' ');
};

export const ensureFriends = async ({ userId, peerId }: EnsureFriendsParams): Promise<void> => {
  const result = await pool.query(
    `SELECT 1
     FROM follows f
     JOIN follows reciprocal
       ON reciprocal.follower_id = f.followed_id
      AND reciprocal.followed_id = f.follower_id
     WHERE f.follower_id = $1 AND f.followed_id = $2
     LIMIT 1`,
    [userId, peerId],
  );

  if (!result.rowCount || result.rowCount === 0) {
    const error = new Error('You can only chat with friends') as AppError;
    error.status = 403;
    error.code = 'CHAT_FRIEND_REQUIRED';
    throw error;
  }
};

export const listConversation = async ({
  userId,
  peerId,
  limit = 80,
}: ListConversationParams): Promise<ConversationMessage[]> => {
  await ensureFriends({ userId, peerId });
  const parsedLimit = typeof limit === 'number' ? limit : Number.parseInt(String(limit), 10);
  const safeLimit = Math.min(Math.max(parsedLimit || 80, 1), 150);

  const result = await pool.query<ConversationMessage>(
    `SELECT
       dm.id,
       dm.sender_id,
       dm.recipient_id,
       dm.content,
       dm.is_read,
       dm.created_at,
       sender.name AS sender_name,
       sender.avatar_url AS sender_avatar_url
     FROM (
       SELECT *
       FROM direct_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at DESC
       LIMIT $3
     ) dm
     JOIN users sender ON sender.firebase_uid = dm.sender_id
     ORDER BY dm.created_at ASC`,
    [userId, peerId, safeLimit],
  );

  return result.rows;
};

export const listMessageThreads = async ({
  userId,
}: ListMessageThreadsParams): Promise<MessageThread[]> => {
  const result = await pool.query<MessageThread>(
    `WITH scoped_messages AS (
       SELECT
         dm.*,
         CASE
           WHEN dm.sender_id = $1 THEN dm.recipient_id
           ELSE dm.sender_id
         END AS peer_id
       FROM direct_messages dm
       WHERE dm.sender_id = $1 OR dm.recipient_id = $1
     ),
     friends AS (
       SELECT f.followed_id AS peer_id
       FROM follows f
       JOIN follows reciprocal
         ON reciprocal.follower_id = f.followed_id
        AND reciprocal.followed_id = f.follower_id
       WHERE f.follower_id = $1
     ),
     latest AS (
       SELECT DISTINCT ON (scoped_messages.peer_id) scoped_messages.*
       FROM scoped_messages
       JOIN friends ON friends.peer_id = scoped_messages.peer_id
       ORDER BY scoped_messages.peer_id, scoped_messages.created_at DESC
     ),
     unread AS (
       SELECT sender_id AS peer_id, COUNT(*)::int AS unread_count
       FROM direct_messages
       WHERE recipient_id = $1 AND is_read = false
       GROUP BY sender_id
     )
     SELECT
       latest.peer_id,
       latest.id,
       latest.sender_id,
       latest.recipient_id,
       latest.content,
       latest.is_read,
       latest.created_at,
       COALESCE(unread.unread_count, 0) AS unread_count,
       u.name AS peer_name,
       u.email AS peer_email,
       u.avatar_url AS peer_avatar_url,
       u.last_seen_at AS peer_last_seen_at,
       u.current_lat AS peer_current_lat,
       u.current_lng AS peer_current_lng
     FROM latest
     JOIN users u ON u.firebase_uid = latest.peer_id
     LEFT JOIN unread ON unread.peer_id = latest.peer_id
     ORDER BY latest.created_at DESC`,
    [userId],
  );

  return result.rows;
};

export const sendDirectMessage = async ({
  senderId,
  recipientId,
  content,
}: SendDirectMessageParams): Promise<DirectMessageRecord> => {
  await ensureFriends({ userId: senderId, peerId: recipientId });
  const normalizedContent = sanitizeMessage(content);
  if (!normalizedContent) {
    const error = new Error('Message content is required') as AppError;
    error.status = 400;
    error.code = 'MESSAGE_CONTENT_REQUIRED';
    throw error;
  }

  if (normalizedContent.length > 2000) {
    const error = new Error('Message is too long') as AppError;
    error.status = 400;
    error.code = 'MESSAGE_TOO_LONG';
    throw error;
  }

  const result = await pool.query<DirectMessageRecord>(
    `INSERT INTO direct_messages (sender_id, recipient_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
    [senderId, recipientId, normalizedContent],
  );

  const message = result.rows[0];

  // Push realtime DM tới cả sender (multi-tab) và recipient
  if (message) {
    const payload: DirectMessagePayload = {
      ...message,
      peer_id_for_sender: recipientId,
      peer_id_for_recipient: senderId,
    };
    try {
      sendToUser(recipientId, 'new_message', payload);
      sendToUser(senderId, 'new_message', payload);
    } catch {
      /* non-critical */
    }
  }

  return message;
};

export const markConversationRead = async ({
  userId,
  peerId,
}: MarkConversationReadParams): Promise<void> => {
  await ensureFriends({ userId, peerId });
  await pool.query(
    `UPDATE direct_messages
     SET is_read = true
     WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false`,
    [peerId, userId],
  );
};

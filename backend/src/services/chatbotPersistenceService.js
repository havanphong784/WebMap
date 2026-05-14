import {randomUUID} from "crypto";
import pool from "../config/db.js";

const CHATBOT_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_role ON chat_messages(user_id, role, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_trips (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
  session_id VARCHAR(64) REFERENCES chat_sessions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  duration_hours INTEGER,
  budget VARCHAR(80),
  preferences TEXT[] DEFAULT '{}',
  route_geometry JSONB,
  route_distance_meters NUMERIC,
  route_duration_seconds NUMERIC,
  route_source VARCHAR(80),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_saved_trips_user_id ON saved_trips(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS saved_trip_stops (
  id BIGSERIAL PRIMARY KEY,
  trip_id VARCHAR(64) NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trip_id, location_id)
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE SET NULL,
  session_id VARCHAR(64) REFERENCES chat_sessions(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(120) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  experiment_variant VARCHAR(80),
  prompt_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  duration_ms INTEGER,
  status VARCHAR(30) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS experiment_variant VARCHAR(80);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_variant ON ai_usage_logs(experiment_variant, model, created_at DESC);

CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE SET NULL,
  session_id VARCHAR(64) REFERENCES chat_sessions(id) ON DELETE SET NULL,
  assistant_message_id BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  reason VARCHAR(120),
  comment TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, assistant_message_id)
);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_session_id ON chatbot_feedback(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_rating ON chatbot_feedback(rating, created_at DESC);
`;

// Schema đã được quản lý trong db_setup.sql. Giữ hàm này để tương thích ngược.
export const ensureChatbotTables = async () => {};

export const createSessionId = () => randomUUID();

export const ensureChatSession = async ({sessionId, userId, title}) => {
  const id = sessionId || createSessionId();
  const result = await pool.query(
    `INSERT INTO chat_sessions (id, user_id, title)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [id, userId, title || "EVE Chat"]
  );
  return result.rows[0];
};

export const saveChatMessage = async ({sessionId, userId, role, content, metadata = {}}) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (session_id, user_id, role, content, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [sessionId, userId, role, content, metadata]
  );
  return result.rows[0];
};

export const saveChatFeedback = async ({
  userId,
  sessionId,
  assistantMessageId,
  rating,
  reason = null,
  comment = null,
  metadata = {},
}) => {
  const normalizedRating = Number(rating) > 0 ? 1 : -1;
  const result = await pool.query(
    `INSERT INTO chatbot_feedback
     (user_id, session_id, assistant_message_id, rating, reason, comment, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, assistant_message_id)
     DO UPDATE SET
       rating = EXCLUDED.rating,
       reason = EXCLUDED.reason,
       comment = EXCLUDED.comment,
       metadata = EXCLUDED.metadata,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [
      userId,
      sessionId,
      assistantMessageId,
      normalizedRating,
      reason || null,
      comment || null,
      metadata || {},
    ]
  );
  return result.rows[0];
};

export const saveTrip = async ({
  userId,
  sessionId,
  title,
  options = {},
  locations = [],
  route = null,
}) => {
  if (!locations.length) return null;

  const client = await pool.connect();
  const tripId = randomUUID();

  try {
    await client.query("BEGIN");
    const tripResult = await client.query(
      `INSERT INTO saved_trips
       (id, user_id, session_id, title, duration_hours, budget, preferences,
        route_geometry, route_distance_meters, route_duration_seconds, route_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        tripId,
        userId,
        sessionId,
        title || `Chuyến đi ${options.durationHours || 4} giờ`,
        options.durationHours || null,
        options.budget || null,
        Array.isArray(options.preferences) ? options.preferences : [],
        route?.geometry || null,
        route?.distanceMeters || null,
        route?.durationSeconds || null,
        route?.source || null,
      ]
    );

    for (const [index, location] of locations.entries()) {
      await client.query(
        `INSERT INTO saved_trip_stops (trip_id, location_id, stop_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (trip_id, location_id) DO NOTHING`,
        [tripId, location.id, index + 1]
      );
    }

    await client.query("COMMIT");
    return {
      ...tripResult.rows[0],
      stops: locations.map((location, index) => ({
        ...location,
        stop_order: index + 1,
      })),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const logAiUsage = async ({
  userId,
  sessionId,
  provider = "google",
  model,
  requestType = "chat",
  experimentVariant = null,
  usageMetadata = {},
  durationMs,
  status,
  errorMessage = null,
}) => {
  await pool.query(
    `INSERT INTO ai_usage_logs
     (user_id, session_id, provider, model, request_type, experiment_variant, prompt_tokens,
      output_tokens, total_tokens, duration_ms, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      userId,
      sessionId,
      provider,
      model,
      requestType,
      experimentVariant,
      usageMetadata.promptTokenCount || null,
      usageMetadata.candidatesTokenCount || null,
      usageMetadata.totalTokenCount || null,
      durationMs || null,
      status,
      errorMessage,
    ]
  );
};

export const listSavedTrips = async ({userId, limit = 10}) => {
  const result = await pool.query(
    `SELECT
       t.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id', l.id,
             'name', l.name,
             'address', l.address,
             'category', l.category,
             'lat', l.lat,
             'lng', l.lng,
             'stop_order', s.stop_order
           )
           ORDER BY s.stop_order
         ) FILTER (WHERE l.id IS NOT NULL),
         '[]'::json
       ) AS stops
     FROM saved_trips t
     LEFT JOIN saved_trip_stops s ON s.trip_id = t.id
     LEFT JOIN locations l ON l.id = s.location_id
     WHERE t.user_id = $1
     GROUP BY t.id
     ORDER BY t.created_at DESC
     LIMIT $2`,
    [userId, Math.min(Math.max(Number(limit) || 10, 1), 30)]
  );

  return result.rows;
};

export const listChatSessions = async ({userId, limit = 20}) => {
  const result = await pool.query(
    `SELECT
       s.id,
       s.title,
       s.created_at,
       s.updated_at,
       (
         SELECT content
         FROM chat_messages m
         WHERE m.session_id = s.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) AS last_message,
       (
         SELECT COUNT(*)::int
         FROM chat_messages m
         WHERE m.session_id = s.id
       ) AS message_count
     FROM chat_sessions s
     WHERE s.user_id = $1
     ORDER BY s.updated_at DESC
     LIMIT $2`,
    [userId, Math.min(Math.max(Number(limit) || 20, 1), 50)]
  );

  return result.rows;
};

export const listChatMessages = async ({userId, sessionId, limit = 80}) => {
  const result = await pool.query(
    `SELECT
       m.id,
       m.session_id,
       m.role,
       m.content,
       m.metadata,
       m.created_at,
       f.rating AS feedback_rating
     FROM chat_messages m
     JOIN chat_sessions s ON s.id = m.session_id
     LEFT JOIN chatbot_feedback f
       ON f.assistant_message_id = m.id
      AND f.user_id = $1
     WHERE m.session_id = $2
       AND s.user_id = $1
     ORDER BY m.created_at ASC
     LIMIT $3`,
    [userId, sessionId, Math.min(Math.max(Number(limit) || 80, 1), 200)]
  );

  return result.rows;
};

export const getUserChatbotProfile = async ({userId}) => {
  const [tagResult, categoryResult, tripResult, messageResult] = await Promise.all([
    pool.query(
      `SELECT tag, COUNT(*)::int AS weight
       FROM (
         SELECT unnest(l.tags) AS tag
         FROM locations l
         WHERE l.user_id = $1
         UNION ALL
         SELECT unnest(l.tags) AS tag
         FROM likes lk
         JOIN locations l ON l.id = lk.location_id
         WHERE lk.user_id = $1
         UNION ALL
         SELECT unnest(st.preferences) AS tag
         FROM saved_trips st
         WHERE st.user_id = $1
       ) signals
       WHERE tag IS NOT NULL AND tag <> ''
       GROUP BY tag
       ORDER BY weight DESC, tag ASC
       LIMIT 12`,
      [userId]
    ),
    pool.query(
      `SELECT category, COUNT(*)::int AS weight
       FROM (
         SELECT l.category
         FROM locations l
         WHERE l.user_id = $1
         UNION ALL
         SELECT l.category
         FROM likes lk
         JOIN locations l ON l.id = lk.location_id
         WHERE lk.user_id = $1
         UNION ALL
         SELECT l.category
         FROM saved_trip_stops s
         JOIN saved_trips t ON t.id = s.trip_id
         JOIN locations l ON l.id = s.location_id
         WHERE t.user_id = $1
       ) signals
       WHERE category IS NOT NULL AND category <> ''
       GROUP BY category
       ORDER BY weight DESC, category ASC
       LIMIT 8`,
      [userId]
    ),
    pool.query(
      `SELECT t.id, t.title, t.duration_hours, t.budget, t.preferences, t.created_at
       FROM saved_trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 5`,
      [userId]
    ),
    pool.query(
      `SELECT content
       FROM chat_messages
       WHERE user_id = $1 AND role = 'user'
       ORDER BY created_at DESC
       LIMIT 8`,
      [userId]
    ),
  ]);

  return {
    preferredTags: tagResult.rows,
    preferredCategories: categoryResult.rows,
    recentTrips: tripResult.rows,
    recentMessages: messageResult.rows.map(row => row.content),
  };
};

export const getChatbotExperimentMetrics = async ({days = 14} = {}) => {
  const safeDays = Math.min(Math.max(Number(days) || 14, 1), 90);
  const result = await pool.query(
    `WITH usage AS (
       SELECT
         COALESCE(experiment_variant, 'unknown') AS experiment_variant,
         model,
         COUNT(*)::int AS request_count,
         AVG(duration_ms)::numeric(10, 2) AS avg_duration_ms,
         AVG(total_tokens)::numeric(10, 2) AS avg_total_tokens,
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::int AS success_count,
         SUM(CASE WHEN status = 'fallback' THEN 1 ELSE 0 END)::int AS fallback_count,
         SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END)::int AS error_count
       FROM ai_usage_logs
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY COALESCE(experiment_variant, 'unknown'), model
     ),
     feedback AS (
       SELECT
         COALESCE(m.metadata->>'experimentVariant', 'unknown') AS experiment_variant,
         COUNT(f.id)::int AS feedback_count,
         SUM(CASE WHEN f.rating = 1 THEN 1 ELSE 0 END)::int AS positive_count,
         SUM(CASE WHEN f.rating = -1 THEN 1 ELSE 0 END)::int AS negative_count,
         AVG(f.rating)::numeric(10, 3) AS avg_rating
       FROM chatbot_feedback f
       JOIN chat_messages m ON m.id = f.assistant_message_id
       WHERE f.created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY COALESCE(m.metadata->>'experimentVariant', 'unknown')
     )
     SELECT
       u.experiment_variant,
       u.model,
       u.request_count,
       u.avg_duration_ms,
       u.avg_total_tokens,
       u.success_count,
       u.fallback_count,
       u.error_count,
       COALESCE(f.feedback_count, 0) AS feedback_count,
       COALESCE(f.positive_count, 0) AS positive_count,
       COALESCE(f.negative_count, 0) AS negative_count,
       f.avg_rating,
       CASE
         WHEN COALESCE(f.feedback_count, 0) = 0 THEN NULL
         ELSE ROUND((f.positive_count::numeric / f.feedback_count::numeric) * 100, 2)
       END AS positive_rate
     FROM usage u
     LEFT JOIN feedback f ON f.experiment_variant = u.experiment_variant
     ORDER BY u.request_count DESC, u.experiment_variant ASC`,
    [safeDays]
  );

  return {
    days: safeDays,
    variants: result.rows,
  };
};

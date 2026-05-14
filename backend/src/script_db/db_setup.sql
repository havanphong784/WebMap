CREATE TABLE IF NOT EXISTS users (
    firebase_uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    tier VARCHAR(20) DEFAULT 'Wanderer',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    current_lat NUMERIC(10, 8),
    current_lng NUMERIC(11, 8)
);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users (xp);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_lat NUMERIC(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_lng NUMERIC(11, 8);

CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    lat NUMERIC(10, 8) NOT NULL,
    lng NUMERIC(11, 8) NOT NULL,
    review_text TEXT,
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_locations_tags ON locations USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_locations_lat ON locations (lat);
CREATE INDEX IF NOT EXISTS idx_locations_lng ON locations (lng);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations (user_id);

CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_location_id ON likes (location_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comments_location_id ON comments (location_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    sender_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

CREATE TABLE IF NOT EXISTS direct_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    recipient_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_direct_messages_pair ON direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS follows (
    follower_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    followed_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);

CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    title_vi VARCHAR(100) NOT NULL,
    description_vi TEXT,
    xp_reward INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    category VARCHAR(50),
    requirement_type VARCHAR(50),
    requirement_value INTEGER NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common'
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    is_seen BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    title_vi VARCHAR(100) NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50),
    requirement_value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_daily_tasks (
    user_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    task_id INTEGER REFERENCES daily_tasks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    task_date DATE DEFAULT CURRENT_DATE,
    is_seen BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, task_id, task_date)
);
CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_date ON user_daily_tasks (user_id, task_date);

INSERT INTO achievements (key_name, title_vi, description_vi, xp_reward, icon_name, category, requirement_type, requirement_value, rarity)
VALUES 
('first_location', 'Người Tiên Phong', 'Tạo địa điểm đầu tiên trên bản đồ', 200, 'MapPin', 'contribution', 'location_count', 1, 'common'),
('location_10', 'Người Mở Đường', 'Đóng góp 10 địa điểm lên bản đồ', 1000, 'Map', 'contribution', 'location_count', 10, 'rare'),
('location_50', 'Hướng Dẫn Viên', 'Đóng góp 50 địa điểm lên bản đồ', 5000, 'Compass', 'contribution', 'location_count', 50, 'epic'),
('location_100', 'Bản Đồ Sống', 'Đóng góp 100 địa điểm lên bản đồ', 15000, 'Globe', 'contribution', 'location_count', 100, 'legendary'),
('photographer_5', 'Tay Máy Cừ Khôi', 'Tải lên 5 bức ảnh', 350, 'Camera', 'contribution', 'photo_count', 5, 'common'),
('photographer_20', 'Nhiếp Ảnh Gia', 'Tải lên 20 bức ảnh', 1500, 'Camera', 'contribution', 'photo_count', 20, 'rare'),
('photographer_50', 'Nghệ Sĩ Ánh Sáng', 'Tải lên 50 bức ảnh', 4000, 'Image', 'contribution', 'photo_count', 50, 'epic'),
('photographer_100', 'Bậc Thầy Nhiếp Ảnh', 'Tải lên 100 bức ảnh', 10000, 'Aperture', 'contribution', 'photo_count', 100, 'legendary'),
('reviewer_10', 'Nhà Phê Bình', 'Viết 10 bài review chi tiết', 800, 'Star', 'contribution', 'long_review_count', 10, 'rare'),
('reviewer_50', 'Chuyên Gia Đánh Giá', 'Viết 50 bài review chi tiết', 3000, 'Award', 'contribution', 'long_review_count', 50, 'epic'),
('reviewer_100', 'Tiếng Nói Uy Tín', 'Viết 100 bài review chi tiết', 8000, 'MessageSquare', 'contribution', 'long_review_count', 100, 'legendary'),
('social_10', 'Người Dễ Gần', 'Đóng góp 10 bình luận', 500, 'MessageCircle', 'social', 'comment_count', 10, 'common'),
('social_50', 'Người Kết Nối', 'Đóng góp 50 bình luận', 2000, 'Users', 'social', 'comment_count', 50, 'rare'),
('social_200', 'Tâm Điểm Cộng Đồng', 'Đóng góp 200 bình luận', 6000, 'Hash', 'social', 'comment_count', 200, 'epic'),
('like_10', 'Được Yêu Thích', 'Nhận được 10 lượt thích', 500, 'ThumbsUp', 'social', 'like_received_count', 10, 'common'),
('like_king_100', 'Ông Hoàng Tương Tác', 'Nhận được 100 lượt thích', 3000, 'Heart', 'social', 'like_received_count', 100, 'epic'),
('like_500', 'Thần Tượng Aether', 'Nhận được 500 lượt thích', 10000, 'Zap', 'social', 'like_received_count', 500, 'legendary')
ON CONFLICT (key_name) DO UPDATE SET 
    title_vi = EXCLUDED.title_vi,
    description_vi = EXCLUDED.description_vi,
    xp_reward = EXCLUDED.xp_reward,
    requirement_value = EXCLUDED.requirement_value,
    rarity = EXCLUDED.rarity;

INSERT INTO daily_tasks (key_name, title_vi, xp_reward, requirement_type, requirement_value)
VALUES 
('daily_like', 'Lan tỏa yêu thương', 50, 'like_given_count', 1),
('daily_comment', 'Tham gia thảo luận', 80, 'comment_count', 1),
('daily_long_review', 'Review có tâm', 200, 'long_review_count', 1),
('daily_photo', 'Chia sẻ khoảnh khắc', 150, 'photo_count', 1)
ON CONFLICT (key_name) DO UPDATE SET 
    xp_reward = EXCLUDED.xp_reward,
    title_vi = EXCLUDED.title_vi;


-- =============================================
-- CHATBOT & AI TABLES
-- =============================================

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

-- ==========================================================
-- SCRIPT KHỞI TẠO DATABASE ĐẦY ĐỦ - AETHER GEO-SOCIAL
-- Bao gồm: Bảng, Chỉ mục (Indexes), và Dữ liệu mẫu
-- ==========================================================

-- 1. Bảng Users (Người dùng)
CREATE TABLE IF NOT EXISTS users (
    firebase_uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    tier VARCHAR(20) DEFAULT 'Scout',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users (xp);

-- 2. Bảng Locations (Địa điểm)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_locations_tags ON locations USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_locations_lat ON locations (lat);
CREATE INDEX IF NOT EXISTS idx_locations_lng ON locations (lng);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations (user_id);

-- 3. Bảng Likes (Lượt thích)
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_location_id ON likes (location_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

-- 4. Bảng Comments (Bình luận)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comments_location_id ON comments (location_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

-- 5. Bảng Notifications (Thông báo)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    sender_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);

-- 6. Bảng Achievements (Thành tựu)
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

-- 7. Bảng User Achievements (Tiến trình thành tựu)
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP,
    is_seen BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, achievement_id)
);

-- 8. Bảng Daily Tasks (Nhiệm vụ hàng ngày)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE NOT NULL,
    title_vi VARCHAR(100) NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50),
    requirement_value INTEGER NOT NULL
);

-- 9. Bảng User Daily Tasks (Tiến trình nhiệm vụ ngày)
CREATE TABLE IF NOT EXISTS user_daily_tasks (
    user_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE CASCADE,
    task_id INTEGER REFERENCES daily_tasks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    task_date DATE DEFAULT CURRENT_DATE,
    is_seen BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, task_id, task_date)
);
CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_date ON user_daily_tasks (user_id, task_date);

-- ==========================================================
-- DỮ LIỆU MẪU (DATA SEEDING)
-- ==========================================================

-- Chèn Thành tựu mẫu
INSERT INTO achievements (key_name, title_vi, description_vi, xp_reward, icon_name, category, requirement_type, requirement_value, rarity)
VALUES 
('first_location', 'Người Tiên Phong', 'Tạo địa điểm đầu tiên trên bản đồ', 100, 'MapPin', 'contribution', 'location_count', 1, 'common'),
('photographer_5', 'Tay Máy Cừ Khôi', 'Tải lên 5 bức ảnh chất lượng', 150, 'Camera', 'contribution', 'photo_count', 5, 'common'),
('reviewer_10', 'Nhà Phê Bình', 'Viết 10 bài review chất lượng (trên 10 từ)', 400, 'Star', 'contribution', 'long_review_count', 10, 'rare'),
('photographer_20', 'Nhiếp Ảnh Gia Chuyên Nghiệp', 'Tải lên 20 bức ảnh chất lượng', 600, 'Camera', 'contribution', 'photo_count', 20, 'epic'),
('social_50', 'Người Kết Nối', 'Đóng góp 50 bình luận thảo luận', 700, 'MessageCircle', 'social', 'comment_count', 50, 'epic'),
('like_king_100', 'Ông Hoàng Tương Tác', 'Nhận được 100 lượt thích', 800, 'Heart', 'social', 'like_received_count', 100, 'epic'),
('master_contributor', 'Kiến Trúc Sư Aether', 'Tạo 30 địa điểm công cộng trên bản đồ', 2000, 'Zap', 'contribution', 'location_count', 30, 'legendary')
ON CONFLICT (key_name) DO NOTHING;

-- Chèn Nhiệm vụ ngày mẫu
INSERT INTO daily_tasks (key_name, title_vi, xp_reward, requirement_type, requirement_value)
VALUES 
('daily_like', 'Lan tỏa yêu thương', 20, 'like_given_count', 1),
('daily_comment', 'Tham gia thảo luận', 30, 'comment_count', 1),
('daily_long_review', 'Review có tâm', 60, 'long_review_count', 1),
('daily_photo', 'Chia sẻ khoảnh khắc', 50, 'photo_count', 1)
ON CONFLICT (key_name) DO NOTHING;

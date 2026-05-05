-- Thêm cột is_seen để theo dõi thông báo
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT TRUE;
ALTER TABLE user_daily_tasks ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT TRUE;

-- Cập nhật logic: Khi một thành tựu/nhiệm vụ mới hoàn thành, set is_seen = FALSE
-- (Việc này sẽ được xử lý trong gamificationService.js)

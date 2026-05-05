-- Thêm cột rarity nếu chưa có
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';

-- Xóa dữ liệu cũ
TRUNCATE TABLE user_daily_tasks CASCADE;
TRUNCATE TABLE daily_tasks CASCADE;
TRUNCATE TABLE user_achievements CASCADE;
TRUNCATE TABLE achievements CASCADE;

-- Insert Thành tựu trọn đời (Đã loại bỏ Check-in)
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

-- Insert Nhiệm vụ hàng ngày (Đã loại bỏ Check-in)
INSERT INTO daily_tasks (key_name, title_vi, xp_reward, requirement_type, requirement_value)
VALUES 
('daily_like', 'Lan tỏa yêu thương', 20, 'like_given_count', 1),
('daily_comment', 'Tham gia thảo luận', 30, 'comment_count', 1),
('daily_long_review', 'Review có tâm', 60, 'long_review_count', 1),
('daily_photo', 'Chia sẻ khoảnh khắc', 50, 'photo_count', 1)
ON CONFLICT (key_name) DO NOTHING;

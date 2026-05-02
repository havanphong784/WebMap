-- Migration: Thêm cột tags vào bảng locations
-- Chạy script này để cập nhật database hiện có

ALTER TABLE locations
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Tạo GIN index để tìm kiếm tags nhanh hơn
CREATE INDEX IF NOT EXISTS idx_locations_tags ON locations USING GIN (tags);

-- Ví dụ kiểm tra
-- SELECT id, name, tags FROM locations LIMIT 5;

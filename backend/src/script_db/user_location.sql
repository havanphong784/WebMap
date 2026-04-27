-- Dọn dẹp bảng cũ (phải xóa locations trước vì nó dính khóa ngoại)
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. BẢNG USERS (Khớp 100% với file auth.route.js của bạn)
CREATE TABLE users
(
    firebase_uid VARCHAR(128) PRIMARY KEY, -- Đổi tên thành firebase_uid cho khớp
    email        VARCHAR(255) UNIQUE NOT NULL,
    name         VARCHAR(255),
    avatar_url   TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG LOCATIONS (Khớp 100% với file locationRoutes.js và Form)
CREATE TABLE locations
(
    id          SERIAL PRIMARY KEY,

    -- Khóa ngoại nối vào cột firebase_uid của bảng users
    user_id     VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,

    -- Thông tin cơ bản
    name        VARCHAR(255) NOT NULL,
    address     TEXT         NOT NULL,
    category    VARCHAR(50)  DEFAULT 'other',

    -- Tọa độ bản đồ
    lat         NUMERIC(10, 8) NOT NULL,
    lng         NUMERIC(11, 8) NOT NULL,

    -- Đánh giá & Hình ảnh
    review_text TEXT,
    rating      INT          DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url   TEXT,

    -- Hệ thống
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE locations ADD COLUMN is_public BOOLEAN DEFAULT true;

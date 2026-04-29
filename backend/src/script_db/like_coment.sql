-- 1. Bảng Likes: Lưu vết ai đã thích địa điểm nào
CREATE TABLE likes
(
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT          NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ràng buộc: Một người chỉ được like một địa điểm 1 lần
    UNIQUE (user_id, location_id)
);

-- 2. Bảng Comments: Lưu các bình luận
CREATE TABLE comments
(
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT          NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

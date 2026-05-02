-- Bảng Notifications: Lưu các thông báo cho người dùng
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    sender_id VARCHAR(128) REFERENCES users(firebase_uid) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'system'
    message TEXT,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để truy vấn nhanh cho người nhận
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

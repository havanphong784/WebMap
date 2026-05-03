CREATE TABLE likes
(
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT          NOT NUL    L REFERENCES locations (id) ON DELETE CASCADE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, location_id)
);

CREATE TABLE comments
(
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,
    location_id INT          NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

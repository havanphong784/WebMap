CREATE TABLE users
(
    firebase_uid VARCHAR(128) PRIMARY KEY,
    email        VARCHAR(255) UNIQUE NOT NULL,
    name         VARCHAR(255),
    avatar_url   TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations
(
    id          SERIAL PRIMARY KEY,

    user_id     VARCHAR(128) NOT NULL REFERENCES users (firebase_uid) ON DELETE CASCADE,

    name        VARCHAR(255) NOT NULL,
    address     TEXT         NOT NULL,
    category    VARCHAR(50)  DEFAULT 'other',

    lat         NUMERIC(10, 8) NOT NULL,
    lng         NUMERIC(11, 8) NOT NULL,

    review_text TEXT,
    rating      INT          DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url   TEXT,

    tags        TEXT[]       DEFAULT '{}',

    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_locations_tags ON locations USING GIN (tags);

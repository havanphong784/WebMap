-- Add gamification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'Scout';

-- Create an index on XP for rankings later
CREATE INDEX IF NOT EXISTS idx_users_xp ON users (xp);

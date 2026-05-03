ALTER TABLE locations
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_locations_tags ON locations USING GIN (tags);

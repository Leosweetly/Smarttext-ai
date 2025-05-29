-- Add online_ordering_url column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS online_ordering_url TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_online_ordering_url ON businesses(online_ordering_url);

-- Comment on the column to document its purpose
COMMENT ON COLUMN businesses.online_ordering_url IS 'URL for online ordering system, displayed in missed call auto-replies';

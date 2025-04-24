-- Create a table to track migration operations from Airtable to Supabase
CREATE TABLE IF NOT EXISTS supabase_migration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  airtable_success BOOLEAN,
  supabase_success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on entity_type and entity_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_migration_logs_entity ON supabase_migration_logs (entity_type, entity_id);

-- Create an index on operation for filtering by operation type
CREATE INDEX IF NOT EXISTS idx_migration_logs_operation ON supabase_migration_logs (operation);

-- Create an index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_migration_logs_created_at ON supabase_migration_logs (created_at);

-- Add a comment to the table
COMMENT ON TABLE supabase_migration_logs IS 'Logs for tracking the migration from Airtable to Supabase';

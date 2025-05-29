#!/bin/bash

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env.local"
    exit 1
fi

# Apply schema
psql "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_URL}/postgres" -f scripts/create-supabase-schema.sql

# Apply RLS policies
psql "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_URL}/postgres" -f scripts/setup-supabase-rls.sql

# Verify schema and policies
psql "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_URL}/postgres" -c "\dt"  # List tables
psql "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_URL}/postgres" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('businesses', 'call_events', 'rate_limits');"

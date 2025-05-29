#!/bin/bash

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
else
    echo ".env.local already exists"
fi

# Check if schema has been applied
if [ ! -f ".supabase_schema_applied" ]; then
    echo "Applying Supabase schema..."
    npx supabase db push
    touch .supabase_schema_applied
else
    echo "Supabase schema already applied"
fi

# Check if RLS policies have been applied
if [ ! -f ".supabase_rls_applied" ]; then
    echo "Applying RLS policies..."
    psql "postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_URL}/postgres" -f scripts/setup-supabase-rls.sql
    touch .supabase_rls_applied
else
    echo "RLS policies already applied"
fi

# Test the connection
echo "Testing Supabase connection..."
npm run test-supabase-connection

# Display setup completion message
echo "\nBackend setup completed!"
echo "Please make sure to update your .env.local file with your Supabase credentials:"

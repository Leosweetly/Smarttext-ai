#!/bin/bash

# Apply schema
psql "postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb2ppcXZ3d21wZnB4c3R0emNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDUwMTI5NiwiZXhwIjoyMDYwMDc3Mjk2fQ.xTKqiXxUj6ISgpwLHqbPT0Y4A-J8iqr1zO9YG1MmbC0@db.aeojiqvwwmpfpxsttzca.supabase.co/postgres" -f scripts/create-supabase-schema.sql

# Apply RLS policies
psql "postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb2ppcXZ3d21wZnB4c3R0emNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDUwMTI5NiwiZXhwIjoyMDYwMDc3Mjk2fQ.xTKqiXxUj6ISgpwLHqbPT0Y4A-J8iqr1zO9YG1MmbC0@db.aeojiqvwwmpfpxsttzca.supabase.co/postgres" -f scripts/setup-supabase-rls.sql

# Verify schema and policies
psql "postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb2ppcXZ3d21wZnB4c3R0emNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDUwMTI5NiwiZXhwIjoyMDYwMDc3Mjk2fQ.xTKqiXxUj6ISgpwLHqbPT0Y4A-J8iqr1zO9YG1MmbC0@db.aeojiqvwwmpfpxsttzca.supabase.co/postgres" -c "\dt"  # List tables
psql "postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb2ppcXZ3d21wZnB4c3R0emNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDUwMTI5NiwiZXhwIjoyMDYwMDc3Mjk2fQ.xTKqiXxUj6ISgpwLHqbPT0Y4A-J8iqr1zO9YG1MmbC0@db.aeojiqvwwmpfpxsttzca.supabase.co/postgres" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('businesses', 'call_events', 'rate_limits');"

-- SQL script to set up Row Level Security (RLS) for Supabase tables
-- This script enables RLS and creates policies for the businesses, call_events, and rate_limits tables

-- Enable RLS on businesses table
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policy for businesses table
CREATE POLICY "Service role can access all businesses"
ON businesses
FOR ALL
USING (auth.role() = 'service_role');

-- Enable RLS on call_events table
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;

-- Create policy for call_events table
CREATE POLICY "Service role can access all call events"
ON call_events
FOR ALL
USING (auth.role() = 'service_role');

-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate_limits table
CREATE POLICY "Service role can access all rate limits"
ON rate_limits
FOR ALL
USING (auth.role() = 'service_role');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('businesses', 'call_events', 'rate_limits');

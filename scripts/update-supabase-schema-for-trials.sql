-- Update businesses table to support trial functionality and user association
-- This script adds missing fields needed for the trial activation endpoint

-- Add missing fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS online_ordering_link TEXT,
ADD COLUMN IF NOT EXISTS reservation_link TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_tier ON businesses(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_businesses_trial_ends_at ON businesses(trial_ends_at);

-- Update RLS policies to allow users to access their own businesses
CREATE POLICY "Users can view their own businesses" 
ON businesses FOR SELECT 
USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own businesses" 
ON businesses FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own businesses" 
ON businesses FOR UPDATE 
USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON COLUMN businesses.user_id IS 'References the authenticated user who owns this business';
COMMENT ON COLUMN businesses.trial_ends_at IS 'When the trial period ends for this business';
COMMENT ON COLUMN businesses.subscription_tier IS 'Current subscription level: trial, basic, pro, enterprise';
COMMENT ON COLUMN businesses.subscription_status IS 'Current subscription status: trial, active, inactive, cancelled';

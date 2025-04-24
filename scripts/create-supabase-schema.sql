-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_type TEXT DEFAULT 'other',
  public_phone TEXT,
  twilio_phone TEXT,
  forwarding_number TEXT,
  address TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  custom_settings JSONB DEFAULT '{}'::jsonb,
  hours_json JSONB DEFAULT '{}'::jsonb,
  faqs_json JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for phone number lookups
CREATE INDEX IF NOT EXISTS idx_businesses_public_phone ON businesses(public_phone);
CREATE INDEX IF NOT EXISTS idx_businesses_twilio_phone ON businesses(twilio_phone);

-- Create call_events table
CREATE TABLE IF NOT EXISTS call_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_sid TEXT,
  from_number TEXT,
  to_number TEXT,
  business_id UUID REFERENCES businesses(id),
  event_type TEXT NOT NULL, -- 'voice.inbound', 'voice.missed', 'sms.inbound', etc.
  call_status TEXT,
  owner_notified BOOLEAN DEFAULT FALSE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_call_events_business_id ON call_events(business_id);
CREATE INDEX IF NOT EXISTS idx_call_events_call_sid ON call_events(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_events_ts ON call_events(ts);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  key TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create composite index for phone+key lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_phone_key ON rate_limits(phone, key);
-- Create index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can do all" 
ON businesses FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do all" 
ON call_events FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do all" 
ON rate_limits FOR ALL 
USING (auth.role() = 'service_role');

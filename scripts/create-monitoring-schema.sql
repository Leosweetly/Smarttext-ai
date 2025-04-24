-- Create sms_events table to track all SMS attempts and outcomes
CREATE TABLE IF NOT EXISTS sms_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_sid TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  business_id UUID REFERENCES businesses(id),
  status TEXT NOT NULL, -- 'sent', 'delivered', 'failed', 'undelivered', 'rate_limited'
  error_code TEXT,
  error_message TEXT,
  request_id TEXT,
  body_length INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for sms_events
CREATE INDEX IF NOT EXISTS idx_sms_events_business_id ON sms_events(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_events_message_sid ON sms_events(message_sid);
CREATE INDEX IF NOT EXISTS idx_sms_events_created_at ON sms_events(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_events_status ON sms_events(status);

-- Create api_usage table to track OpenAI API usage
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service TEXT NOT NULL, -- 'openai', 'twilio', etc.
  endpoint TEXT NOT NULL, -- specific API endpoint or function
  business_id UUID REFERENCES businesses(id),
  tokens_used INTEGER DEFAULT 0, -- for OpenAI
  cost_estimate DECIMAL(10, 6) DEFAULT 0, -- estimated cost in USD
  model TEXT, -- for OpenAI, which model was used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reset_date DATE DEFAULT CURRENT_DATE, -- for daily tracking
  request_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for api_usage
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_business_id ON api_usage(business_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_reset_date ON api_usage(reset_date);

-- Create owner_alerts table to track all owner notifications
CREATE TABLE IF NOT EXISTS owner_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  owner_phone TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'missed_call', 'urgent_message', 'custom_keyword', etc.
  message_content TEXT NOT NULL,
  detection_source TEXT, -- 'gpt_classification', 'custom_keywords', etc.
  message_sid TEXT, -- Twilio message SID if available
  delivered BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for owner_alerts
CREATE INDEX IF NOT EXISTS idx_owner_alerts_business_id ON owner_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_owner_alerts_created_at ON owner_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_owner_alerts_alert_type ON owner_alerts(alert_type);

-- Create daily_stats table for aggregated metrics
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  date DATE NOT NULL,
  calls_total INTEGER DEFAULT 0,
  calls_missed INTEGER DEFAULT 0,
  calls_answered INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  sms_success_count INTEGER DEFAULT 0,
  sms_failure_count INTEGER DEFAULT 0,
  openai_tokens_used INTEGER DEFAULT 0,
  openai_cost_estimate DECIMAL(10, 6) DEFAULT 0,
  owner_alerts_sent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for business_id + date
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_business_date ON daily_stats(business_id, date);

-- Enable Row Level Security
ALTER TABLE sms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
CREATE POLICY "Service role can do all" 
ON sms_events FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do all" 
ON api_usage FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do all" 
ON owner_alerts FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do all" 
ON daily_stats FOR ALL 
USING (auth.role() = 'service_role');

-- Create view for SMS failure rate analysis
CREATE OR REPLACE VIEW sms_failure_rates AS
SELECT 
  business_id,
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' OR status = 'undelivered' THEN 1 ELSE 0 END) as failed,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      ROUND((SUM(CASE WHEN status = 'failed' OR status = 'undelivered' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0
  END as failure_rate_percent
FROM sms_events
GROUP BY business_id, DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Create view for OpenAI daily usage
CREATE OR REPLACE VIEW openai_daily_usage AS
SELECT 
  business_id,
  reset_date as date,
  SUM(tokens_used) as total_tokens,
  SUM(cost_estimate) as total_cost
FROM api_usage
WHERE service = 'openai'
GROUP BY business_id, reset_date
ORDER BY reset_date DESC;

-- Create function to reset daily OpenAI usage counters
CREATE OR REPLACE FUNCTION reset_daily_openai_usage()
RETURNS void AS $$
BEGIN
  -- Create a new record for each business with today's date if it doesn't exist
  INSERT INTO api_usage (service, endpoint, business_id, tokens_used, cost_estimate, model, reset_date)
  SELECT 
    'openai', 
    'daily_reset', 
    id, 
    0, 
    0, 
    NULL, 
    CURRENT_DATE
  FROM businesses
  WHERE NOT EXISTS (
    SELECT 1 FROM api_usage 
    WHERE service = 'openai' 
    AND endpoint = 'daily_reset' 
    AND business_id = businesses.id 
    AND reset_date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to update daily stats
CREATE OR REPLACE FUNCTION update_daily_stats(business_id_param UUID, date_param DATE)
RETURNS void AS $$
DECLARE
  calls_total_count INTEGER;
  calls_missed_count INTEGER;
  calls_answered_count INTEGER;
  messages_received_count INTEGER;
  messages_sent_count INTEGER;
  sms_success_count_val INTEGER;
  sms_failure_count_val INTEGER;
  openai_tokens_used_val INTEGER;
  openai_cost_estimate_val DECIMAL(10, 6);
  owner_alerts_sent_count INTEGER;
BEGIN
  -- Count calls
  SELECT 
    COUNT(*),
    SUM(CASE WHEN event_type = 'voice.missed' THEN 1 ELSE 0 END),
    SUM(CASE WHEN event_type != 'voice.missed' THEN 1 ELSE 0 END)
  INTO calls_total_count, calls_missed_count, calls_answered_count
  FROM call_events
  WHERE business_id = business_id_param
  AND DATE(ts) = date_param;

  -- Count messages received (from Twilio webhook)
  SELECT COUNT(*)
  INTO messages_received_count
  FROM call_events
  WHERE business_id = business_id_param
  AND event_type = 'sms.inbound'
  AND DATE(ts) = date_param;

  -- Count SMS sent and success/failure
  SELECT 
    COUNT(*),
    SUM(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'failed' OR status = 'undelivered' THEN 1 ELSE 0 END)
  INTO messages_sent_count, sms_success_count_val, sms_failure_count_val
  FROM sms_events
  WHERE business_id = business_id_param
  AND DATE(created_at) = date_param;

  -- Get OpenAI usage
  SELECT 
    SUM(tokens_used),
    SUM(cost_estimate)
  INTO openai_tokens_used_val, openai_cost_estimate_val
  FROM api_usage
  WHERE business_id = business_id_param
  AND service = 'openai'
  AND reset_date = date_param;

  -- Count owner alerts
  SELECT COUNT(*)
  INTO owner_alerts_sent_count
  FROM owner_alerts
  WHERE business_id = business_id_param
  AND DATE(created_at) = date_param;

  -- Insert or update daily stats
  INSERT INTO daily_stats (
    business_id, 
    date, 
    calls_total, 
    calls_missed, 
    calls_answered, 
    messages_received, 
    messages_sent, 
    sms_success_count, 
    sms_failure_count, 
    openai_tokens_used, 
    openai_cost_estimate, 
    owner_alerts_sent
  )
  VALUES (
    business_id_param,
    date_param,
    COALESCE(calls_total_count, 0),
    COALESCE(calls_missed_count, 0),
    COALESCE(calls_answered_count, 0),
    COALESCE(messages_received_count, 0),
    COALESCE(messages_sent_count, 0),
    COALESCE(sms_success_count_val, 0),
    COALESCE(sms_failure_count_val, 0),
    COALESCE(openai_tokens_used_val, 0),
    COALESCE(openai_cost_estimate_val, 0),
    COALESCE(owner_alerts_sent_count, 0)
  )
  ON CONFLICT (business_id, date)
  DO UPDATE SET
    calls_total = COALESCE(calls_total_count, 0),
    calls_missed = COALESCE(calls_missed_count, 0),
    calls_answered = COALESCE(calls_answered_count, 0),
    messages_received = COALESCE(messages_received_count, 0),
    messages_sent = COALESCE(messages_sent_count, 0),
    sms_success_count = COALESCE(sms_success_count_val, 0),
    sms_failure_count = COALESCE(sms_failure_count_val, 0),
    openai_tokens_used = COALESCE(openai_tokens_used_val, 0),
    openai_cost_estimate = COALESCE(openai_cost_estimate_val, 0),
    owner_alerts_sent = COALESCE(owner_alerts_sent_count, 0),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

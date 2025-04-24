-- Migration to add custom_alert_keywords to businesses table
ALTER TABLE businesses 
ADD COLUMN custom_alert_keywords TEXT[] DEFAULT '{}';

-- Create index for faster keyword searches
CREATE INDEX IF NOT EXISTS idx_businesses_custom_alert_keywords ON businesses USING GIN (custom_alert_keywords);

-- Comment on the column to document its purpose
COMMENT ON COLUMN businesses.custom_alert_keywords IS 'Array of custom keywords that trigger urgent alerts to business owners';

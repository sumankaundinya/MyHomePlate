-- Add phone number and notification fields to chefs table
ALTER TABLE chefs 
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_opt_in BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_order_notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_chefs_phone_number ON chefs(phone_number);

-- Add notification_logs table to track all sent SMS
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  order_id UUID,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  provider TEXT,
  provider_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Index for notification logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_chef_id ON notification_logs(chef_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Create tables for voice onboarding
CREATE TABLE IF NOT EXISTS onboarding_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  contact_type TEXT CHECK (contact_type IN ('chef', 'customer')) NOT NULL,
  name TEXT,
  area TEXT,
  contact_status TEXT DEFAULT 'not_contacted' CHECK (contact_status IN ('not_contacted', 'pending', 'contacted', 'interested', 'not_interested')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES onboarding_contacts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  call_sid TEXT,
  call_duration_seconds INTEGER,
  call_status TEXT CHECK (call_status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer')) DEFAULT 'initiated',
  call_type TEXT CHECK (call_type IN ('chef_onboarding', 'customer_acquisition', 'follow_up')) DEFAULT 'chef_onboarding',
  recording_url TEXT,
  transcription TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_contacts_status ON onboarding_contacts(contact_status);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_contact_id ON voice_call_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_logs_created_at ON voice_call_logs(created_at DESC);

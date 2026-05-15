ALTER TABLE onboarding_contacts
ADD COLUMN IF NOT EXISTS whatsapp_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_sent_at timestamptz;

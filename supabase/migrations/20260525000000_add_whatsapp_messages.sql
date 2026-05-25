CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES onboarding_contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  gupshup_message_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread ON whatsapp_messages(is_read) WHERE is_read = FALSE;

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read and mark messages as read
CREATE POLICY "authenticated_read_whatsapp_messages"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_update_whatsapp_messages"
  ON whatsapp_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role (edge functions) can do everything
CREATE POLICY "service_role_all_whatsapp_messages"
  ON whatsapp_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

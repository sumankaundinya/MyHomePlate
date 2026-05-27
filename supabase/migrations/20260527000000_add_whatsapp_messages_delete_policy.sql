-- Allow authenticated users (admins) to delete WhatsApp messages from the inbox
CREATE POLICY "authenticated_delete_whatsapp_messages"
  ON whatsapp_messages FOR DELETE
  TO authenticated
  USING (true);

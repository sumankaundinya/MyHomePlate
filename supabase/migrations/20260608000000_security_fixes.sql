-- Fix 1: Meals browseable without login (currently blocks anonymous visitors)
DROP POLICY IF EXISTS "Anyone can view available meals" ON public.meals;
CREATE POLICY "Anyone can view available meals"
  ON public.meals FOR SELECT
  TO anon, authenticated
  USING (available = true);

-- Fix 2: Restrict WhatsApp inbox to admin only (was readable by all logged-in users)
DROP POLICY IF EXISTS "authenticated_read_whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "admin_read_whatsapp_messages"
  ON whatsapp_messages FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "authenticated_update_whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "admin_update_whatsapp_messages"
  ON whatsapp_messages FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "authenticated_delete_whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "admin_delete_whatsapp_messages"
  ON whatsapp_messages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: handle_new_user trigger must always assign 'customer'
-- regardless of what the client sends in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  );

  -- Only allow 'chef' or 'customer' from client metadata — never 'admin'
  _role := CASE
    WHEN (NEW.raw_user_meta_data->>'role') = 'chef' THEN 'chef'::app_role
    ELSE 'customer'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

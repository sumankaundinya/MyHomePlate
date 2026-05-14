-- Move delivery fee to chef level (flat rate for their area) + delivery radius
ALTER TABLE public.chefs
  ADD COLUMN IF NOT EXISTS delivery_fee     NUMERIC  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_radius_km INTEGER NOT NULL DEFAULT 3;

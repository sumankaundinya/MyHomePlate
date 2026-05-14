-- Chef sets their own delivery fee per meal (0 = free delivery)
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC NOT NULL DEFAULT 0;

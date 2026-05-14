-- Add meal_type to subscriptions so customers can specify Breakfast, Lunch, or Dinner.
-- Defaults to 'lunch' for backward compatibility with existing rows.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS meal_type TEXT NOT NULL DEFAULT 'lunch'
    CHECK (meal_type IN ('breakfast', 'lunch', 'dinner'));

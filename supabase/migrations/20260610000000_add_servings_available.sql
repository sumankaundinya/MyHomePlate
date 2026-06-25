-- Track how many servings a chef can fulfil per day/session.
-- NULL means unlimited (default). Set to a positive integer to cap orders.

ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS servings_available INTEGER DEFAULT NULL
    CONSTRAINT servings_available_positive CHECK (servings_available IS NULL OR servings_available >= 0);

-- Atomic decrement used by create-razorpay-order to prevent overselling.
-- Returns TRUE if the decrement succeeded (enough servings were available),
-- FALSE if the meal was already sold out or has no stock limit (NULL).
CREATE OR REPLACE FUNCTION public.decrement_servings(meal_uuid UUID, qty INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.meals
  SET servings_available = servings_available - qty
  WHERE id = meal_uuid
    AND servings_available IS NOT NULL
    AND servings_available >= qty;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;

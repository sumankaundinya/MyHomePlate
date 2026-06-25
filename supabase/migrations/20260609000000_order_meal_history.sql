-- Preserve order history when a chef deletes a meal.
-- Previously meal_id had ON DELETE CASCADE which wiped all order records.
-- Now we store a snapshot of the meal name and price at order time,
-- and change the FK to SET NULL so the order row survives meal deletion.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS meal_title TEXT,
  ADD COLUMN IF NOT EXISTS meal_price_at_order DECIMAL(10, 2);

-- Backfill existing orders with the current meal data
UPDATE public.orders o
SET
  meal_title = m.title,
  meal_price_at_order = m.price
FROM public.meals m
WHERE o.meal_id = m.id
  AND o.meal_title IS NULL;

-- Re-key: drop the CASCADE constraint, allow NULL, add SET NULL
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_meal_id_fkey;
ALTER TABLE public.orders ALTER COLUMN meal_id DROP NOT NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_meal_id_fkey
  FOREIGN KEY (meal_id) REFERENCES public.meals(id) ON DELETE SET NULL;

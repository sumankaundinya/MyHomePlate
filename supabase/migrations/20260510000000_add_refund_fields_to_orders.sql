ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_status TEXT
    CHECK (refund_status IN ('pending', 'processed', 'failed'));

-- Allow customers to cancel their own orders (needed for refund flow)
CREATE POLICY "Customers can cancel own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (status = 'cancelled');

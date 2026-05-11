-- Chef payout details: stores each chef's UPI ID or bank account info
CREATE TABLE chef_payout_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  payout_method TEXT NOT NULL CHECK (payout_method IN ('upi', 'bank')) DEFAULT 'upi',
  upi_id TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  razorpay_contact_id TEXT,
  razorpay_fund_account_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chef_id)
);

ALTER TABLE chef_payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chef_payout_details_own"
  ON chef_payout_details
  FOR ALL
  TO authenticated
  USING (chef_id IN (SELECT id FROM chefs WHERE user_id = auth.uid()))
  WITH CHECK (chef_id IN (SELECT id FROM chefs WHERE user_id = auth.uid()));

CREATE POLICY "chef_payout_details_admin_read"
  ON chef_payout_details
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_chef_payout_details_updated_at
  BEFORE UPDATE ON chef_payout_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Chef payouts ledger: one record per payout triggered on order delivery
CREATE TABLE chef_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payout_amount DECIMAL(10,2) NOT NULL,
  razorpay_payout_id TEXT,
  razorpay_fund_account_id TEXT,
  payout_method TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'processed', 'failed')) DEFAULT 'pending',
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chef_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chef_payouts_own_read"
  ON chef_payouts
  FOR SELECT
  TO authenticated
  USING (chef_id IN (SELECT id FROM chefs WHERE user_id = auth.uid()));

CREATE POLICY "chef_payouts_admin_read"
  ON chef_payouts
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER update_chef_payouts_updated_at
  BEFORE UPDATE ON chef_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

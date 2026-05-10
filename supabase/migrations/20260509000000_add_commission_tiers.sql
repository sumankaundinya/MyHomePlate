-- Create commission_tiers table for dynamic pricing
CREATE TABLE IF NOT EXISTS commission_tiers (
  id BIGSERIAL PRIMARY KEY,
  tier_name VARCHAR(100) NOT NULL UNIQUE,
  commission_rate DECIMAL(5, 2) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_commission_tiers_active ON commission_tiers(is_active);
CREATE INDEX idx_commission_tiers_valid_from ON commission_tiers(valid_from);
CREATE INDEX idx_commission_tiers_valid_to ON commission_tiers(valid_to);

-- Insert initial tiers (MyHomePlate phases)
INSERT INTO commission_tiers (tier_name, commission_rate, valid_from, valid_to, description, is_active)
VALUES 
  ('Launch Phase - 0% Commission', 0.00, '2026-01-01'::TIMESTAMP, '2026-07-01'::TIMESTAMP, 'Initial 6 months - 0% commission to attract chefs and build community', true),
  ('Growth Phase - 10% Commission', 10.00, '2026-07-01'::TIMESTAMP, '2027-07-01'::TIMESTAMP, 'Months 7-18 - 10% commission to sustain operations', true),
  ('Mature Phase - TBD', 15.00, '2027-07-01'::TIMESTAMP, NULL, 'After 18 months - Rate to be determined based on market', false);

-- Add enable_rowlevel_security
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to view current rates
CREATE POLICY "Allow public read access to commission_tiers"
  ON commission_tiers
  FOR SELECT
  USING (is_active = true);

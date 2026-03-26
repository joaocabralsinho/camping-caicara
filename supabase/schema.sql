-- =============================================
-- CAMPING CAIÇARA - DATABASE SCHEMA
-- =============================================

-- 1. ACCOMMODATIONS
-- Each row = one bookable unit
CREATE TABLE accommodations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,            -- e.g. "Chalé 1", "Cabana 2", "Camping"
  type TEXT NOT NULL,            -- "chale", "cabana", "suite", "camping"
  max_capacity INT NOT NULL,    -- max people allowed
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the inventory
INSERT INTO accommodations (name, type, max_capacity, description) VALUES
  ('Chalé 1',       'chale',   6, 'Chalé grande para até 6 pessoas'),
  ('Chalé 2',       'chale',   4, 'Chalé para até 4 pessoas'),
  ('Chalé 3',       'chale',   4, 'Chalé para até 4 pessoas'),
  ('Suíte',         'suite',   5, 'Suíte para até 5 pessoas'),
  ('Cabana 1',      'cabana',  2, 'Cabana para até 2 pessoas'),
  ('Cabana 2',      'cabana',  2, 'Cabana para até 2 pessoas'),
  ('Área de Camping','camping', 500, 'Área de camping - cliente traz a própria barraca');


-- 2. PRICING
-- Prices per accommodation type, per date range
-- This lets you set different prices for holidays, weekends, etc.
CREATE TABLE pricing (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  date_start DATE NOT NULL,        -- start of this price period
  date_end DATE NOT NULL,          -- end of this price period
  price_per_night DECIMAL(10,2) NOT NULL,  -- price in BRL
  label TEXT,                      -- e.g. "Réveillon", "Alta Temporada", "Normal"
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. RESERVATIONS
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  num_people INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- "pending", "confirmed", "cancelled", "completed"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. PAYMENTS
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL,       -- "full" (100% with 5% discount) or "partial" (50% deposit)
  payment_method TEXT,              -- "pix", "card", etc.
  status TEXT NOT NULL DEFAULT 'pending',  -- "pending", "paid", "refunded"
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. BLOCKED DATES (optional but useful)
-- Admin can manually block dates for any accommodation
CREATE TABLE blocked_dates (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  date_blocked DATE NOT NULL,
  reason TEXT,                     -- e.g. "Manutenção", "Evento privado"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

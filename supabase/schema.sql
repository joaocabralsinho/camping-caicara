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


-- 2. SEASONS
-- Special date ranges with different pricing (Réveillon, Carnaval, etc.)
CREATE TABLE seasons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,            -- e.g. "Réveillon 2026/2027", "Carnaval 2027"
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. PRICING
-- Flexible pricing: supports per-night, per-person-per-night, and package pricing
-- Guest tiers allow different prices based on party size (e.g. Chalé: casal R$300, 4 pessoas R$500)
-- season_id = NULL means regular/default pricing
CREATE TABLE pricing (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  season_id INT REFERENCES seasons(id),  -- NULL = regular pricing
  min_guests INT NOT NULL DEFAULT 1,
  max_guests INT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('per_night', 'per_person_per_night', 'package')),
  price DECIMAL(10,2) NOT NULL,
  min_stay_days INT,            -- for stay-length discounts (e.g. camping réveillon 3+ days)
  label TEXT,                   -- display label (e.g. "Casal", "Pacote Réveillon")
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. RESERVATIONS
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  cpf TEXT NOT NULL,               -- Brazilian tax ID (validated)
  rg TEXT NOT NULL,                -- Brazilian identity card number
  num_people INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- "pending", "confirmed", "cancelled", "completed"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. PAYMENTS
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


-- 6. BLOCKED DATES
-- Admin can manually block dates for any accommodation
CREATE TABLE blocked_dates (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  date_blocked DATE NOT NULL,
  reason TEXT,                     -- e.g. "Manutenção", "Evento privado"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MIGRATION: Pricing Engine (Phase 3)
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create seasons table (for Réveillon, Carnaval, etc.)
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop old pricing table (it's empty, no data loss)
DROP TABLE IF EXISTS pricing;

-- 3. Create new pricing table with guest tiers and price types
CREATE TABLE pricing (
  id SERIAL PRIMARY KEY,
  accommodation_id INT NOT NULL REFERENCES accommodations(id),
  season_id INT REFERENCES seasons(id),  -- NULL = regular/default pricing
  min_guests INT NOT NULL DEFAULT 1,
  max_guests INT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('per_night', 'per_person_per_night', 'package')),
  price DECIMAL(10,2) NOT NULL,
  min_stay_days INT,  -- for stay-length discounts (e.g., camping réveillon 3+ days = R$80)
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEED: Regular pricing
-- =============================================

-- Chalé 1 (max 6 people): casal R$300, 4 pessoas R$500, 6 pessoas R$700
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT id, NULL::INT, 1, 2, 'per_night', 300.00, 'Casal' FROM accommodations WHERE name = 'Chalé 1'
UNION ALL
SELECT id, NULL::INT, 3, 4, 'per_night', 500.00, '3-4 pessoas' FROM accommodations WHERE name = 'Chalé 1'
UNION ALL
SELECT id, NULL::INT, 5, 6, 'per_night', 700.00, '5-6 pessoas' FROM accommodations WHERE name = 'Chalé 1';

-- Chalé 2 (max 4 people): casal R$300, 4 pessoas R$500
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT id, NULL::INT, 1, 2, 'per_night', 300.00, 'Casal' FROM accommodations WHERE name = 'Chalé 2'
UNION ALL
SELECT id, NULL::INT, 3, 4, 'per_night', 500.00, '3-4 pessoas' FROM accommodations WHERE name = 'Chalé 2';

-- Chalé 3 (max 4 people): same as Chalé 2
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT id, NULL::INT, 1, 2, 'per_night', 300.00, 'Casal' FROM accommodations WHERE name = 'Chalé 3'
UNION ALL
SELECT id, NULL::INT, 3, 4, 'per_night', 500.00, '3-4 pessoas' FROM accommodations WHERE name = 'Chalé 3';

-- Suíte — prices TBD (waiting for client)
-- No pricing inserted yet

-- Cabana 1 (Bangalô): R$200/noite flat
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT id, NULL::INT, 1, 2, 'per_night', 200.00, 'Por noite' FROM accommodations WHERE name = 'Cabana 1';

-- Cabana 2 (Bangalô): R$200/noite flat
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT id, NULL::INT, 1, 2, 'per_night', 200.00, 'Por noite' FROM accommodations WHERE name = 'Cabana 2';

-- Camping: R$60/pessoa/noite
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT id, NULL::INT, 1, 500, 'per_person_per_night', 60.00, 'Por pessoa' FROM accommodations WHERE name = 'Área de Camping';

-- =============================================
-- SEED: Réveillon 2026/2027 (Dec 27 → Jan 4)
-- =============================================

INSERT INTO seasons (name, date_start, date_end) VALUES
  ('Réveillon 2026/2027', '2026-12-27', '2027-01-04');

-- Chalé 1 — Réveillon package R$7.000
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT a.id, s.id, 1, 6, 'package', 7000.00, 'Pacote Réveillon'
FROM accommodations a, seasons s
WHERE a.name = 'Chalé 1' AND s.name = 'Réveillon 2026/2027';

-- Chalé 2 — Réveillon package R$6.500
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT a.id, s.id, 1, 4, 'package', 6500.00, 'Pacote Réveillon'
FROM accommodations a, seasons s
WHERE a.name = 'Chalé 2' AND s.name = 'Réveillon 2026/2027';

-- Chalé 3 — Réveillon package R$6.500
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT a.id, s.id, 1, 4, 'package', 6500.00, 'Pacote Réveillon'
FROM accommodations a, seasons s
WHERE a.name = 'Chalé 3' AND s.name = 'Réveillon 2026/2027';

-- Cabana 1 — Réveillon package R$2.800
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT a.id, s.id, 1, 2, 'package', 2800.00, 'Pacote Réveillon'
FROM accommodations a, seasons s
WHERE a.name = 'Cabana 1' AND s.name = 'Réveillon 2026/2027';

-- Cabana 2 — Réveillon package R$2.800
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT a.id, s.id, 1, 2, 'package', 2800.00, 'Pacote Réveillon'
FROM accommodations a, seasons s
WHERE a.name = 'Cabana 2' AND s.name = 'Réveillon 2026/2027';

-- Camping — Réveillon R$100/pessoa/dia (default)
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, label)
SELECT a.id, s.id, 1, 500, 'per_person_per_night', 100.00, 'Réveillon'
FROM accommodations a, seasons s
WHERE a.name = 'Área de Camping' AND s.name = 'Réveillon 2026/2027';

-- Camping — Réveillon R$80/pessoa/dia (3+ days discount)
INSERT INTO pricing (accommodation_id, season_id, min_guests, max_guests, price_type, price, min_stay_days, label)
SELECT a.id, s.id, 1, 500, 'per_person_per_night', 80.00, 3, 'Réveillon 3+ dias'
FROM accommodations a, seasons s
WHERE a.name = 'Área de Camping' AND s.name = 'Réveillon 2026/2027';

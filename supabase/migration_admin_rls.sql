-- =============================================
-- MIGRATION: Admin Dashboard RLS Policies (Phase 6)
-- Run this in Supabase SQL Editor (new tab)
-- =============================================

-- Enable RLS on all tables (idempotent)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RESERVATIONS: allow public read + insert (already exist), add update
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update reservations') THEN
    CREATE POLICY "Allow public update reservations" ON reservations FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================
-- PRICING: full CRUD for admin (via anon key)
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read pricing') THEN
    CREATE POLICY "Allow public read pricing" ON pricing FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert pricing') THEN
    CREATE POLICY "Allow public insert pricing" ON pricing FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update pricing') THEN
    CREATE POLICY "Allow public update pricing" ON pricing FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete pricing') THEN
    CREATE POLICY "Allow public delete pricing" ON pricing FOR DELETE USING (true);
  END IF;
END $$;

-- =============================================
-- SEASONS: full CRUD
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read seasons') THEN
    CREATE POLICY "Allow public read seasons" ON seasons FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert seasons') THEN
    CREATE POLICY "Allow public insert seasons" ON seasons FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update seasons') THEN
    CREATE POLICY "Allow public update seasons" ON seasons FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete seasons') THEN
    CREATE POLICY "Allow public delete seasons" ON seasons FOR DELETE USING (true);
  END IF;
END $$;

-- =============================================
-- BLOCKED_DATES: full CRUD
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read blocked_dates') THEN
    CREATE POLICY "Allow public read blocked_dates" ON blocked_dates FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert blocked_dates') THEN
    CREATE POLICY "Allow public insert blocked_dates" ON blocked_dates FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete blocked_dates') THEN
    CREATE POLICY "Allow public delete blocked_dates" ON blocked_dates FOR DELETE USING (true);
  END IF;
END $$;

-- =============================================
-- ACCOMMODATIONS: ensure public read exists
-- =============================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read accommodations') THEN
    CREATE POLICY "Allow public read accommodations" ON accommodations FOR SELECT USING (true);
  END IF;
END $$;

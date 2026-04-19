-- Core tables (idempotent), RLS, contact privacy via offers_visible view, request reports, offer rate limit

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Пользователь',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget TEXT,
  city TEXT,
  deadline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  images TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.requests TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.requests TO authenticated;

DROP POLICY IF EXISTS "requests_select_all" ON public.requests;
CREATE POLICY "requests_select_all"
  ON public.requests FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "requests_insert_own" ON public.requests;
CREATE POLICY "requests_insert_own"
  ON public.requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "requests_update_own" ON public.requests;
CREATE POLICY "requests_update_own"
  ON public.requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "requests_delete_own" ON public.requests;
CREATE POLICY "requests_delete_own"
  ON public.requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily limit: new requests per user (anti-spam)
CREATE OR REPLACE FUNCTION public.enforce_request_daily_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.requests
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 day';
  IF cnt >= 80 THEN
    RAISE EXCEPTION 'request_daily_limit_exceeded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS requests_daily_limit ON public.requests;
CREATE TRIGGER requests_daily_limit
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_request_daily_limit();

-- ---------------------------------------------------------------------------
-- offers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT NOT NULL,
  contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  images TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_offers_request_id ON public.offers(request_id);
CREATE INDEX IF NOT EXISTS idx_offers_user_id ON public.offers(user_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Remove old policies if re-run
DROP POLICY IF EXISTS "offers_select_owner_or_author" ON public.offers;
DROP POLICY IF EXISTS "offers_insert_own" ON public.offers;
DROP POLICY IF EXISTS "offers_update_own" ON public.offers;
DROP POLICY IF EXISTS "offers_delete_own" ON public.offers;
DROP POLICY IF EXISTS "offers_public_read" ON public.offers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.offers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.offers;

-- Direct table reads: only offer author or request owner (full row including contact)
CREATE POLICY "offers_select_owner_or_author"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "offers_insert_own"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offers_update_own"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "offers_delete_own"
  ON public.offers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- offers_visible: masked contact for everyone else (security definer view)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.offers_visible;

CREATE VIEW public.offers_visible
WITH (security_invoker = false)
AS
SELECT
  o.id,
  o.request_id,
  o.user_id,
  o.company,
  o.price,
  o.description,
  o.created_at,
  o.images,
  CASE
    WHEN auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.requests r
        WHERE r.id = o.request_id AND r.user_id = auth.uid()
      )
      OR o.user_id = auth.uid()
    )
    THEN o.contact
    ELSE NULL
  END AS contact
FROM public.offers o;

GRANT SELECT ON public.offers_visible TO anon, authenticated;

-- Authors/owners read full rows via RLS on table; public catalog uses offers_visible
REVOKE ALL ON TABLE public.offers FROM anon;
REVOKE ALL ON TABLE public.offers FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.offers TO authenticated;

-- ---------------------------------------------------------------------------
-- Offer daily limit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_offer_daily_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.offers
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 day';
  IF cnt >= 40 THEN
    RAISE EXCEPTION 'offer_daily_limit_exceeded';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS offers_daily_limit ON public.offers;
CREATE TRIGGER offers_daily_limit
  BEFORE INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_offer_daily_limit();

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own" ON public.favorites;
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_insert_own" ON public.favorites;
CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favorites_delete_own" ON public.favorites;
CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

-- ---------------------------------------------------------------------------
-- request_reports (abuse / spam reports)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.request_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_request_reports_request ON public.request_reports(request_id);

ALTER TABLE public.request_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_reports_insert_own" ON public.request_reports;
CREATE POLICY "request_reports_insert_own"
  ON public.request_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "request_reports_select_own" ON public.request_reports;
CREATE POLICY "request_reports_select_own"
  ON public.request_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

GRANT SELECT, INSERT ON public.request_reports TO authenticated;

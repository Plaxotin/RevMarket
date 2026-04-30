-- AI-driven marketplace flow: request journey flags, AI search results, and notification preferences.

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS ai_mode TEXT NOT NULL DEFAULT 'ai_and_sellers'
    CHECK (ai_mode IN ('ai_only', 'sellers_only', 'ai_and_sellers')),
  ADD COLUMN IF NOT EXISTS ai_search_status TEXT NOT NULL DEFAULT 'queued'
    CHECK (ai_search_status IN ('queued', 'searching', 'results_ready', 'needs_review', 'failed', 'disabled')),
  ADD COLUMN IF NOT EXISTS seller_visibility_status TEXT NOT NULL DEFAULT 'published'
    CHECK (seller_visibility_status IN ('draft', 'published', 'paused')),
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_search_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_search_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_requests_ai_search_status
  ON public.requests(ai_search_status);

CREATE TABLE IF NOT EXISTS public.ai_offer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  title TEXT NOT NULL,
  price TEXT,
  url TEXT,
  image_url TEXT,
  delivery_note TEXT,
  match_score INTEGER NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  match_reason TEXT NOT NULL,
  difference_note TEXT,
  risk_note TEXT,
  status TEXT NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'shortlisted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_offer_matches_request_id
  ON public.ai_offer_matches(request_id);

ALTER TABLE public.ai_offer_matches ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_offer_matches TO authenticated;

DROP POLICY IF EXISTS "ai_matches_select_request_owner" ON public.ai_offer_matches;
CREATE POLICY "ai_matches_select_request_owner"
  ON public.ai_offer_matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_matches_insert_request_owner" ON public.ai_offer_matches;
CREATE POLICY "ai_matches_insert_request_owner"
  ON public.ai_offer_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_matches_update_request_owner" ON public.ai_offer_matches;
CREATE POLICY "ai_matches_update_request_owner"
  ON public.ai_offer_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ai_matches_delete_request_owner" ON public.ai_offer_matches;
CREATE POLICY "ai_matches_delete_request_owner"
  ON public.ai_offer_matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

ALTER TABLE public.notification_subscriptions
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_results_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS seller_offers_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS digest_frequency TEXT NOT NULL DEFAULT 'instant'
    CHECK (digest_frequency IN ('instant', 'daily'));

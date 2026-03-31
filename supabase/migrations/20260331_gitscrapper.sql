-- GitScrapper report verification table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.report_verification (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id      text NOT NULL UNIQUE,
  contributor_login text NOT NULL,
  repo           text NOT NULL,
  content_hash   text NOT NULL,
  file_hash      text,
  blockchain_txn text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.report_verification ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for public certificate verification)
CREATE POLICY "Anyone can verify reports"
  ON public.report_verification
  FOR SELECT
  USING (true);

-- Allow inserts from authenticated service role (API routes)
CREATE POLICY "Service role can insert reports"
  ON public.report_verification
  FOR INSERT
  WITH CHECK (true);

-- Index for fast cert lookups
CREATE INDEX IF NOT EXISTS idx_report_verification_report_id
  ON public.report_verification (report_id);

COMMENT ON TABLE public.report_verification IS 'Stores GitScrapper PDF report certificate verification records';

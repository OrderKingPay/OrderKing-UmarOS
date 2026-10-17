-- Migration: 20261017_job_applications_schema.sql
-- Description: JobKing Career Board & ATS applications sink with RLS

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    category TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_contact TEXT NOT NULL,
    applicant_note TEXT,
    status TEXT DEFAULT 'RECEIVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_contact ON public.job_applications (applicant_contact);

-- Enable Row Level Security (RLS)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role bypass on job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow public insert on job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow read job_applications" ON public.job_applications;

-- 1. Service role full access
CREATE POLICY "Service role bypass on job_applications"
ON public.job_applications
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Allow public / authenticated candidates to submit job applications
CREATE POLICY "Allow public insert on job_applications"
ON public.job_applications
FOR INSERT
WITH CHECK (true);

-- 3. Allow read for authenticated internal staff or owners
CREATE POLICY "Allow read job_applications"
ON public.job_applications
FOR SELECT
USING (
    (auth.jwt() ->> 'role' = 'service_role') OR
    (auth.jwt() ->> 'role' = 'admin') OR
    (auth.role() = 'authenticated') OR
    (auth.role() = 'anon')
);

-- ==========================================
-- SUPABASE AUTHENTICATION & HISTORY MIGRATION
-- Run this inside your Supabase SQL Editor
-- ==========================================

-- 1. Add user_id column linking jobs to Supabase Auth users table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create index for fast user-specific queries
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs (user_id);

-- 3. Re-enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 4. Recreate access policies restricted by user ownership (auth.uid())
DROP POLICY IF EXISTS "Allow public read access" ON public.jobs;
DROP POLICY IF EXISTS "Allow public insert access" ON public.jobs;
DROP POLICY IF EXISTS "Allow public update access" ON public.jobs;

CREATE POLICY "Allow users to read their own jobs" ON public.jobs
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own jobs" ON public.jobs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own jobs" ON public.jobs
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own jobs" ON public.jobs
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

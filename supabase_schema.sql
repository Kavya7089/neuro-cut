-- ==========================================
-- NEUROCUT SUPABASE DATABASE SCHEMA
-- Define this schema inside your Supabase SQL Editor
-- ==========================================

-- 1. Create table for storing video production jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    script TEXT NOT NULL,
    art_style VARCHAR(50) DEFAULT 'pixar' NOT NULL,
    status VARCHAR(50) DEFAULT 'idle' NOT NULL,
    current_node VARCHAR(50) DEFAULT 'ingestion' NOT NULL,
    structured_storyboard JSONB DEFAULT '[]'::jsonb NOT NULL,
    assets JSONB DEFAULT '[]'::jsonb NOT NULL,
    safety_report JSONB DEFAULT '{}'::jsonb NOT NULL,
    bgm_volume INTEGER DEFAULT 30 NOT NULL,
    video_url TEXT,
    celery_task_id VARCHAR(100)
);

-- Add descriptions / comments
COMMENT ON TABLE public.jobs IS 'Tracks NeuroCut video generation pipelines across agent nodes.';

-- 2. Create index on status and current_node for fast lookup queries
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs (status);
CREATE INDEX IF NOT EXISTS jobs_current_node_idx ON public.jobs (current_node);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 4. Set up access control policies (modify according to auth requirements)
-- In a public prototype we can allow read/write globally.
CREATE POLICY "Allow public read access" ON public.jobs
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.jobs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.jobs
    FOR UPDATE USING (true);

-- 5. Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SUPABASE STORAGE BUCKET CONFIGURATION (Note)
-- ==========================================
-- To store final video mp4 renders or frames in Supabase Storage:
-- 1. Go to "Storage" in Supabase dashboard.
-- 2. Create a new bucket named "renders".
-- 3. Mark it "Public" so the URLs are accessible directly.
-- 
-- Or run this via your SQL Editor (requires storage schema access):
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('renders', 'renders', true)
-- ON CONFLICT (id) DO NOTHING;

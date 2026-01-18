-- Recap App Database Schema
-- Supabase/PostgreSQL Migration

-- Note: gen_random_uuid() is available by default in Supabase (pgcrypto)

-- ============================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood is stored as integer 1-5 for simplicity and analytics

-- ============================================
-- ENTRIES TABLE
-- Daily mood journal entries
-- ============================================
CREATE TABLE IF NOT EXISTS public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    mood SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 5),
    note TEXT CHECK (char_length(note) <= 500),
    video_url TEXT,
    video_thumbnail_url TEXT,
    video_duration_seconds SMALLINT CHECK (video_duration_seconds <= 60),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One entry per day per user
    CONSTRAINT unique_user_date UNIQUE (user_id, entry_date)
);

-- ============================================
-- YEARLY SUMMARIES TABLE
-- Cached AI-generated yearly summaries
-- ============================================
CREATE TABLE IF NOT EXISTS public.yearly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    year SMALLINT NOT NULL CHECK (year >= 2020 AND year <= 2100),
    summary_text TEXT NOT NULL,
    mood_average DECIMAL(3,2),
    total_entries INTEGER,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_year UNIQUE (user_id, year)
);

-- ============================================
-- INDEXES
-- Performance optimization for common queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON public.entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_user_year ON public.entries(user_id, EXTRACT(YEAR FROM entry_date));
CREATE INDEX IF NOT EXISTS idx_entries_mood ON public.entries(user_id, mood);
CREATE INDEX IF NOT EXISTS idx_yearly_summaries_user_year ON public.yearly_summaries(user_id, year);

-- ============================================
-- ROW LEVEL SECURITY
-- Users can only access their own data
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearly_summaries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Entries policies
CREATE POLICY "Users can view own entries" ON public.entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON public.entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON public.entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON public.entries
    FOR DELETE USING (auth.uid() = user_id);

-- Yearly summaries policies
CREATE POLICY "Users can view own summaries" ON public.yearly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own summaries" ON public.yearly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own summaries" ON public.yearly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS entries_updated_at ON public.entries;
CREATE TRIGGER entries_updated_at
    BEFORE UPDATE ON public.entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger to create profile when user signs up
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORAGE BUCKET
-- For video uploads
-- ============================================
-- Note: Run this in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('videos', 'videos', false);

-- Storage policy: Users can upload to their own folder
-- CREATE POLICY "Users can upload own videos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own videos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own videos"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

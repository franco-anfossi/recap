-- Up Migration for Social Features

-- Follows (Relationship)
CREATE TABLE public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Likes/Reactions
CREATE TABLE public.entry_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_id)
);

-- Add visibility to entries
ALTER TABLE public.entries ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'friends', 'public'));

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Follows
CREATE POLICY "Users can view follows" ON public.follows
    FOR SELECT USING (true); -- Publicly viewable who follows who

CREATE POLICY "Users can manage own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- Reactions
CREATE POLICY "Users can view reactions" ON public.entry_reactions
    FOR SELECT USING (true); 

CREATE POLICY "Users can react" ON public.entry_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove reactions" ON public.entry_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Up Migration for Yearly Goals

-- Add goals table
CREATE TABLE public.yearly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    year SMALLINT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We use gen_random_uuid() instead of uuid_generate_v4() to match previous standard

-- Link entries to goals (Many-to-Many)
CREATE TABLE public.entry_goals (
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.yearly_goals(id) ON DELETE CASCADE,
    PRIMARY KEY (entry_id, goal_id)
);

-- RLS for Goals
ALTER TABLE public.yearly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_goals ENABLE ROW LEVEL SECURITY;

-- Policies for yearly_goals
CREATE POLICY "Users can view own goals" ON public.yearly_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.yearly_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.yearly_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.yearly_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for entry_goals
-- We need to check if the related entry belongs to the user
CREATE POLICY "Users can view own entry goals" ON public.entry_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE id = entry_goals.entry_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own entry goals" ON public.entry_goals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE id = entry_goals.entry_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own entry goals" ON public.entry_goals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.entries 
            WHERE id = entry_goals.entry_id AND user_id = auth.uid()
        )
    );

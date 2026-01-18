-- Fix RLS policy for reactions to allow updating (changing) emoji
-- Currently only INSERT and DELETE are allowed, which fails on upsert.

CREATE POLICY "Users can update own reactions" ON public.entry_reactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Backdated entries are now editable from the calendar, so updates and deletes
-- should be scoped to ownership rather than only the current date.

DROP POLICY IF EXISTS "Users can only modify today's entries" ON public.entries;
DROP POLICY IF EXISTS "Users can only delete today's entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;

CREATE POLICY "Users can update own entries" ON public.entries
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON public.entries
    FOR DELETE USING (auth.uid() = user_id);

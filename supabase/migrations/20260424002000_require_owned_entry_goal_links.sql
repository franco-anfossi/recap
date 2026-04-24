-- Require both sides of an entry-goal link to belong to the current user.
-- The original policies protected the entry side only, which allowed a user
-- with a guessed goal UUID to attach their entry to another user's goal.

DROP POLICY IF EXISTS "Users can view own entry goals" ON public.entry_goals;
DROP POLICY IF EXISTS "Users can insert own entry goals" ON public.entry_goals;
DROP POLICY IF EXISTS "Users can delete own entry goals" ON public.entry_goals;

CREATE POLICY "Users can view own entry goals" ON public.entry_goals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.entries
            WHERE id = entry_goals.entry_id AND user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.yearly_goals
            WHERE id = entry_goals.goal_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own entry goals" ON public.entry_goals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.entries
            WHERE id = entry_goals.entry_id AND user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.yearly_goals
            WHERE id = entry_goals.goal_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own entry goals" ON public.entry_goals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.entries
            WHERE id = entry_goals.entry_id AND user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.yearly_goals
            WHERE id = entry_goals.goal_id AND user_id = auth.uid()
        )
    );

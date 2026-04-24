-- Allow public entries to be visible to any authenticated user.
-- Friends entries remain visible to users who follow the author.

DROP POLICY IF EXISTS "Users can view own and friends entries" ON public.entries;

CREATE POLICY "Users can view own friends and public entries" ON public.entries
FOR SELECT USING (
    auth.uid() = user_id
    OR (auth.uid() IS NOT NULL AND visibility = 'public')
    OR (
        visibility = 'friends'
        AND EXISTS (
            SELECT 1
            FROM public.follows
            WHERE follower_id = auth.uid()
            AND following_id = public.entries.user_id
        )
    )
);

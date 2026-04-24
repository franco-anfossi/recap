-- Tighten social write/read policies after enabling public and friends entries.

DELETE FROM public.follows
WHERE follower_id = following_id;

ALTER TABLE public.follows
DROP CONSTRAINT IF EXISTS follows_no_self_follow;

ALTER TABLE public.follows
ADD CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id);

DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;

CREATE POLICY "Users can insert own follows" ON public.follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id
        AND follower_id <> following_id
    );

CREATE POLICY "Users can delete own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can view reactions" ON public.entry_reactions;
DROP POLICY IF EXISTS "Users can react" ON public.entry_reactions;
DROP POLICY IF EXISTS "Users can remove reactions" ON public.entry_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON public.entry_reactions;

CREATE POLICY "Users can view visible entry reactions" ON public.entry_reactions
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.entries
            WHERE id = entry_reactions.entry_id
            AND (
                user_id = auth.uid()
                OR visibility = 'public'
                OR (
                    visibility = 'friends'
                    AND EXISTS (
                        SELECT 1
                        FROM public.follows
                        WHERE follower_id = auth.uid()
                        AND following_id = public.entries.user_id
                    )
                )
            )
        )
    );

CREATE POLICY "Users can react to visible entries" ON public.entry_reactions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.entries
            WHERE id = entry_reactions.entry_id
            AND (
                user_id = auth.uid()
                OR visibility = 'public'
                OR (
                    visibility = 'friends'
                    AND EXISTS (
                        SELECT 1
                        FROM public.follows
                        WHERE follower_id = auth.uid()
                        AND following_id = public.entries.user_id
                    )
                )
            )
        )
    );

CREATE POLICY "Users can update own visible entry reactions" ON public.entry_reactions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.entries
            WHERE id = entry_reactions.entry_id
            AND (
                user_id = auth.uid()
                OR visibility = 'public'
                OR (
                    visibility = 'friends'
                    AND EXISTS (
                        SELECT 1
                        FROM public.follows
                        WHERE follower_id = auth.uid()
                        AND following_id = public.entries.user_id
                    )
                )
            )
        )
    );

CREATE POLICY "Users can remove own reactions" ON public.entry_reactions
    FOR DELETE USING (auth.uid() = user_id);

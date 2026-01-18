-- Fix RLS policy for entries to allow viewing friends' posts
-- Currently only "own entries" are visible.

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own entries" ON public.entries;

-- 2. Create a new comprehensive policy
CREATE POLICY "Users can view own and friends entries" ON public.entries
FOR SELECT USING (
    -- User can see their own entries
    auth.uid() = user_id
    OR
    (
        -- User can see entries if visibility is 'friends' 
        visibility = 'friends' 
        AND 
        -- AND the user trying to view (auth.uid()) follows the author (user_id)
        EXISTS (
            SELECT 1 FROM public.follows 
            WHERE follower_id = auth.uid() 
            AND following_id = public.entries.user_id
        )
    )
);

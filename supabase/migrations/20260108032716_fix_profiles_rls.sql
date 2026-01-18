-- Fix RLS policy for profiles to allow viewing other users' names
-- Currently only "own profile" is visible.

-- 1. Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 2. Create a new public read policy
-- Profiles (names, avatars) are visible if they are your friend (connected via follows)
CREATE POLICY "Profiles are viewable by friends" ON public.profiles
FOR SELECT USING (
    auth.uid() = id -- Own profile
    OR
    EXISTS (
        SELECT 1 FROM public.follows
        WHERE (follower_id = auth.uid() AND following_id = public.profiles.id) -- You follow them
        OR (follower_id = public.profiles.id AND following_id = auth.uid()) -- They follow you
    )
);

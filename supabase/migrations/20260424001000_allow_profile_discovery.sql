-- Let authenticated users discover profiles for search, follows, and public feed cards.
-- Profile data is already rendered throughout the social surface.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by friends" ON public.profiles;

CREATE POLICY "Authenticated users can discover profiles" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

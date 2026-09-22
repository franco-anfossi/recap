-- Four Burners: every intention belongs to one life area (health, work, family, friends),
-- every check-in records which burners received energy, and a profile can declare
-- one burner it is deliberately turning down for now.

ALTER TABLE public.yearly_goals
    ADD COLUMN IF NOT EXISTS burner TEXT
    CHECK (burner IN ('health', 'work', 'family', 'friends'));

ALTER TABLE public.entries
    ADD COLUMN IF NOT EXISTS burners TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.entries
    DROP CONSTRAINT IF EXISTS entries_burners_valid;

ALTER TABLE public.entries
    ADD CONSTRAINT entries_burners_valid
    CHECK (burners <@ ARRAY['health', 'work', 'family', 'friends']::TEXT[]);

CREATE INDEX IF NOT EXISTS idx_entries_burners ON public.entries USING GIN (burners);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS dimmed_burner TEXT
    CHECK (dimmed_burner IN ('health', 'work', 'family', 'friends'));

-- Account deletion from inside the app (required by the App Store).
-- Deleting the auth user cascades to profiles, entries, goals, follows and reactions.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

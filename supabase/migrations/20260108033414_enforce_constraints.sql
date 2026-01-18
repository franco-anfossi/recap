-- Enforce business logic constraints

-- 1. Prevent modification of past entries
-- Only allow UPDATE/DELETE if the entry date is TODAY (or future, though future entries shouldn't exist)
CREATE POLICY "Users can only modify today's entries" ON public.entries
FOR UPDATE USING (
    auth.uid() = user_id 
    AND entry_date >= CURRENT_DATE
);

CREATE POLICY "Users can only delete today's entries" ON public.entries
FOR DELETE USING (
    auth.uid() = user_id 
    AND entry_date >= CURRENT_DATE
);

-- Drop the old overly permissive policies
DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.entries;


-- 2. Prevent self-reactions
-- Constraint: You cannot insert a reaction if the entry belongs to you
CREATE OR REPLACE FUNCTION public.check_self_reaction()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.entries 
        WHERE id = NEW.entry_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Cannot react to your own entry';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_self_reaction
    BEFORE INSERT ON public.entry_reactions
    FOR EACH ROW EXECUTE FUNCTION public.check_self_reaction();

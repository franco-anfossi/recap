-- ==========================================
-- RECAP APP SEED DATA SCRIPT
-- ==========================================
-- This script populates the database with test users and data.
-- It allows for safe deletion by only targeting specific test accounts.
--
-- Usage: Run this in the Supabase SQL Editor.

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CLEANUP PREVIOUS TEST DATA
-- This ensures we can re-run the script safely.
-- Because of ON DELETE CASCADE, deleting the users will remove their profiles, entries, etc.
DELETE FROM auth.users WHERE email LIKE 'seed_test_%@recap.app';

-- 2. CREATE TEST USERS
-- We insert directly into auth.users. 
-- The 'handle_new_user' trigger will automatically create the public.profiles rows.
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES 
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed_test_alice@recap.app',
    crypt('password123', gen_salt('bf')), -- Password is 'password123'
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Alice Wonderland"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed_test_bob@recap.app',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Bob Builder"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed_test_charlie@recap.app',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Charlie Chaplin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed_test_dave@recap.app',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Dave Diver"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed_test_eve@recap.app',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Eve Explorer"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'seed_test_frank@recap.app',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Frank Farmer"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- 3. INSERT ENTRIES
-- We generate entries from Jan 1st 2026 to Jan 7th 2026 as requested.
INSERT INTO public.entries (user_id, entry_date, mood, note, visibility)
SELECT 
    u.id,
    d::date,
    floor(random() * 5 + 1)::int, -- Random mood 1-5
    (ARRAY[
        'Just chilling today.', 
        'Productive work session!', 
        'Feeling a bit under the weather.', 
        'Walked the dog, nice weather.', 
        'Coding on the Recap app.',
        'Met with friends for coffee.',
        'Read a good book.',
        'Gym time!',
        'Grocery shopping is boring.',
        'Movie night!'
    ])[floor(random() * 10 + 1)],
    (ARRAY['friends', 'private'])[floor(random() * 2 + 1)]::text -- NO 'public'
FROM auth.users u
CROSS JOIN generate_series(
    '2026-01-01'::date, 
    '2026-01-07'::date, 
    '1 day'
) as d
WHERE u.email LIKE 'seed_test_%@recap.app'
AND random() > 0.1; -- 90% chance of having an entry on any given day

-- 4. SOCIAL GRAPH (FOLLOWS)
-- Group A (Alice, Bob, Charlie, Dave) fully connected
-- Group B (Eve, Frank) connected
-- Bridge (Dave -> Eve)
WITH users AS (SELECT id, email FROM auth.users WHERE email LIKE 'seed_test_%@recap.app')
INSERT INTO public.follows (follower_id, following_id)
SELECT u1.id, u2.id
FROM users u1, users u2
WHERE 
    -- Group A
    (u1.email IN ('seed_test_alice@recap.app', 'seed_test_bob@recap.app', 'seed_test_charlie@recap.app', 'seed_test_dave@recap.app')
     AND u2.email IN ('seed_test_alice@recap.app', 'seed_test_bob@recap.app', 'seed_test_charlie@recap.app', 'seed_test_dave@recap.app')
     AND u1.id != u2.id)
    OR
    -- Group B
    (u1.email IN ('seed_test_eve@recap.app', 'seed_test_frank@recap.app')
     AND u2.email IN ('seed_test_eve@recap.app', 'seed_test_frank@recap.app')
     AND u1.id != u2.id)
    OR
    -- Bridge
    (u1.email = 'seed_test_dave@recap.app' AND u2.email = 'seed_test_eve@recap.app');

-- 5. REACTIONS
-- Add some random reactions to friend entries (NO public)
INSERT INTO public.entry_reactions (user_id, entry_id, emoji)
SELECT 
    u.id, 
    e.id, 
    (ARRAY['❤️', '🔥', '👏', '🙌', '😮', '😂'])[floor(random() * 6 + 1)]
FROM auth.users u
JOIN public.entries e ON e.user_id != u.id AND e.visibility = 'friends'
WHERE u.email LIKE 'seed_test_%@recap.app'
AND random() > 0.6 -- 40% chance to react
ON CONFLICT DO NOTHING;

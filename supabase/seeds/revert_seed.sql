-- ==========================================
-- REVERT SEED DATA SCRIPT
-- ==========================================
-- This script effectively removes all data created by the seed.sql script.
-- By deleting the test users, all related profiles, entries, follows, 
-- and reactions will be automatically deleted via ON DELETE CASCADE.

DELETE FROM auth.users 
WHERE email LIKE 'seed_test_%@recap.app';

-- Verify cleanup (Optional - should return 0)
-- SELECT count(*) FROM auth.users WHERE email LIKE 'seed_test_%@recap.app';

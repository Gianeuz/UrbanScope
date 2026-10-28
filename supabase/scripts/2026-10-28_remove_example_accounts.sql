-- ==============================================================================
-- URBANSCOPE - ONE-OFF DATA CLEANUP: remove @example.com demo accounts
-- Target: live Supabase project (vfspjuqymfbagesjxjmc)
-- ==============================================================================
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> + New query -> paste -> RUN.
-- This is a data fix, NOT a schema migration, so it lives outside migrations/
-- and is never run automatically by the Supabase CLI. Safe to re-run.
--
-- Found on 2026-10-28 (read-only check through the REST API):
--   users        2 client@example.com, 3 sarah.j@example.com,
--                4 mark.cruz@example.com, 5 maria.santos@example.com
--   appointments 1, 2, 3 (booked under those example.com emails)
--   saved_properties 1, 2 (user 2 -> deleted automatically, ON DELETE CASCADE)
--   testimonials 1, 2, 3 (user_id becomes NULL via ON DELETE SET NULL; the
--                review text stays, so the home page testimonials still show)
-- ==============================================================================

BEGIN;

-- 1. Appointments booked under example.com emails (FK is SET NULL, so delete
--    them explicitly or they would stay behind without an owner)
DELETE FROM appointments
WHERE client_email ILIKE '%@example.com';

-- 2. Inquiries submitted with example.com emails (none at time of writing)
DELETE FROM inquiries
WHERE client_email ILIKE '%@example.com';

-- 3. The demo user accounts themselves
DELETE FROM users
WHERE email ILIKE '%@example.com';

-- ------------------------------------------------------------------------------
-- OPTIONAL: inquiries from emails that don't belong to any registered account.
-- At time of writing this matches only inquiry #16
-- (czarinasanchez2@gmail.com, "Residential Lot", "Magkano hulugan?").
-- Uncomment to remove it.
-- ------------------------------------------------------------------------------
-- DELETE FROM inquiries i
-- WHERE i.client_id IS NULL
--   AND NOT EXISTS (
--       SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(i.client_email)
--   );

COMMIT;

-- Verification: every count should be 0
SELECT 'users' AS table_name, COUNT(*) AS example_rows FROM users WHERE email ILIKE '%@example.com'
UNION ALL
SELECT 'inquiries', COUNT(*) FROM inquiries WHERE client_email ILIKE '%@example.com'
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments WHERE client_email ILIKE '%@example.com';

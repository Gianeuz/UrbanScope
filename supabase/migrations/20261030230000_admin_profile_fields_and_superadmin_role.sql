-- ==============================================================================
-- URBANSCOPE - MIGRATION 0002: ADMIN PROFILE FIELDS & SUPERADMIN ROLE
-- ==============================================================================
-- Brings the Supabase `users` table in line with the FastAPI/SQLite schema
-- (backend/database.py) so the admin Profile page can persist every field and
-- the superadmin account can be stored with its real role.
--
--   1. Adds `title`, `brokerage`, `bio` profile columns (license_number,
--      avatar_url, google_id already exist from migration 0001).
--   2. Allows role = 'superadmin' in the users.role CHECK constraint.
--
-- Fully idempotent (IF NOT EXISTS / DROP ... IF EXISTS) so it is safe on fresh
-- preview branches, on `supabase db reset`, and on the already-live project.
-- Do NOT edit after it has been applied; add a new timestamped migration instead.
-- ==============================================================================

-- 1. Professional profile columns -------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Licensed Real Estate Broker / Agent';
ALTER TABLE users ADD COLUMN IF NOT EXISTS brokerage TEXT DEFAULT 'CD Miranda Realty';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';

-- 2. Role constraint: keep existing values, add 'superadmin' -------------------
-- Migration 0001 declared the CHECK inline, so Postgres named it users_role_check.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('client', 'agent', 'admin', 'user', 'superadmin'));

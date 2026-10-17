-- ==============================================================================
-- URBANSCOPE RBAC MIGRATION & TRIGGER SCRIPT
-- Enforces automatic role detection and seeds authorized admin credentials.
-- ==============================================================================

-- 1. Ensure users table exists with role CHECK constraint
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT CHECK(role IN ('user', 'admin', 'superadmin')) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trigger on INSERT: automatically sets role based strictly on email
CREATE TRIGGER IF NOT EXISTS trg_user_role_insert
AFTER INSERT ON users
BEGIN
    UPDATE users
    SET role = CASE
        WHEN LOWER(NEW.email) = 'admin.realestate@gmail.com' THEN 'admin'
        WHEN LOWER(NEW.email) = 'urbanscope.cvsu@gmail.com' THEN 'superadmin'
        ELSE 'user'
    END
    WHERE id = NEW.id;
END;

-- 3. Trigger on UPDATE OF email: automatically enforces role matching on email change
CREATE TRIGGER IF NOT EXISTS trg_user_role_update
AFTER UPDATE OF email ON users
BEGIN
    UPDATE users
    SET role = CASE
        WHEN LOWER(NEW.email) = 'admin.realestate@gmail.com' THEN 'admin'
        WHEN LOWER(NEW.email) = 'urbanscope.cvsu@gmail.com' THEN 'superadmin'
        ELSE 'user'
    END
    WHERE id = NEW.id;
END;

-- 4. Demote any non-authorized admin emails to 'user'
UPDATE users
SET role = 'user'
WHERE LOWER(email) NOT IN ('admin.realestate@gmail.com', 'urbanscope.cvsu@gmail.com');

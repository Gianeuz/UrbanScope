#!/usr/bin/env python3
"""
UrbanScope - RBAC Seed & Migration Script
==================================================
Initializes Role-Based Access Control schema, email triggers,
and seeds the authorized admin and superadmin accounts.

Accounts seeded:
- urbanscope.cvsu@gmail.com -> role: superadmin (password: urbanscope2026)
- admin.realestate@gmail.com -> role: admin (password: realestate2026)
"""

import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.database import get_db_connection, init_db
from backend.auth import hash_password, verify_password


def run_rbac_migration():
    print("=" * 60)
    print(" 🛡️  URBANSCOPE RBAC SEED & MIGRATION")
    print("=" * 60)

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Ensure schema & triggers exist
    print("1. Initializing schema and triggers...")
    init_db()

    # 2. Verify triggers on SQLite
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'trg_user_role_%'")
    triggers = cursor.fetchall()
    for name, sql in triggers:
        print(f"   ✓ Trigger active: {name}")

    # 3. Seed / Verify accounts
    print("\n2. Verifying accounts & roles in database:")
    cursor.execute("SELECT id, email, full_name, role, password_hash FROM users ORDER BY id ASC")
    users = cursor.fetchall()

    for u in users:
        u_id, email, full_name, role, pwd_hash = u
        test_pass = None
        if email == "admin.realestate@gmail.com":
            test_pass = "realestate2026"
        elif email == "urbanscope.cvsu@gmail.com":
            test_pass = "urbanscope2026"

        is_valid = verify_password(test_pass, pwd_hash) if test_pass else "N/A"
        print(f"   [{role.upper():10}] ID: {u_id:2} | Email: {email:30} | Name: {full_name:30} | Pass valid: {is_valid}")

    conn.close()
    print("\n✓ RBAC setup completed successfully!\n")


if __name__ == "__main__":
    run_rbac_migration()

"""
UrbanScope - Database Configuration & SQLite Driver
Provides schema initialization, seed data, and connection management.
"""

import os
import sqlite3
from pathlib import Path
from typing import Generator

import unicodedata

# Database file location
DB_DIR = Path(__file__).resolve().parent
DB_PATH = DB_DIR / "urbanscope.db"

def normalize_text(val) -> str:
    """Normalizes string for search: removes accents/diacritics, hyphens, and whitespace."""
    if not val:
        return ""
    # Strip diacritics / accents (e.g. ñ -> n, é -> e)
    s = ''.join(c for c in unicodedata.normalize('NFD', str(val)) if unicodedata.category(c) != 'Mn')
    return s.replace('-', ' ').replace('_', ' ').lower().strip()


def determine_user_role(email: str) -> str:
    """
    Automatic database role detection:
    - admin.realestate@gmail.com -> 'admin'
    - urbanscope.cvsu@gmail.com -> 'superadmin'
    - all other emails -> 'user'
    """
    clean = (email or "").strip().lower()
    if clean == "admin.realestate@gmail.com":
        return "admin"
    elif clean == "urbanscope.cvsu@gmail.com":
        return "superadmin"
    return "user"


def get_db_connection() -> sqlite3.Connection:
    """Creates a database connection with dictionary-like row access and search normalization."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.create_function("NORMALIZE", 1, normalize_text)
    return conn


def init_db():
    """Initializes SQLite schema, triggers, and populates seed records."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table with role ENUM / CHECK constraint
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role TEXT CHECK(role IN ('user', 'admin', 'superadmin')) DEFAULT 'user',
            avatar_url TEXT DEFAULT 'assets/images/agent.jpg',
            google_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Triggers for automatic role enforcement upon insertion or email update
    cursor.execute("""
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
    """)

    cursor.execute("DROP TRIGGER IF EXISTS trg_user_role_update")
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS trg_user_role_update
        AFTER UPDATE OF email ON users
        BEGIN
            UPDATE users
            SET role = CASE
                WHEN LOWER(NEW.email) = 'admin.realestate@gmail.com' THEN 'admin'
                WHEN LOWER(NEW.email) = 'urbanscope.cvsu@gmail.com' THEN 'superadmin'
                ELSE OLD.role
            END
            WHERE id = NEW.id;
        END;
    """)

    # 2. Properties Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            location TEXT NOT NULL,
            property_type TEXT NOT NULL,
            price REAL NOT NULL,
            bedrooms INTEGER DEFAULT 3,
            bathrooms INTEGER DEFAULT 2,
            lot_area REAL DEFAULT 120,
            floor_area REAL DEFAULT 80,
            carports INTEGER DEFAULT 1,
            storeys INTEGER DEFAULT 2,
            status TEXT DEFAULT 'Available',
            image_url TEXT,
            description TEXT,
            amenities TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Non-destructive column migrations for existing databases
    cursor.execute("PRAGMA table_info(properties)")
    existing_cols = {col[1] for col in cursor.fetchall()}
    if "floor_area" not in existing_cols:
        cursor.execute("ALTER TABLE properties ADD COLUMN floor_area REAL DEFAULT 80")
    if "carports" not in existing_cols:
        cursor.execute("ALTER TABLE properties ADD COLUMN carports INTEGER DEFAULT 1")
    if "storeys" not in existing_cols:
        cursor.execute("ALTER TABLE properties ADD COLUMN storeys INTEGER DEFAULT 2")
    if "amenities" not in existing_cols:
        cursor.execute("ALTER TABLE properties ADD COLUMN amenities TEXT DEFAULT ''")

    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = {col[1] for col in cursor.fetchall()}
    if "avatar_url" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT 'assets/images/agent.jpg'")
    if "google_id" not in existing_user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN google_id TEXT")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL")

    # 3. Inquiries Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_title TEXT,
            client_name TEXT NOT NULL,
            client_email TEXT NOT NULL,
            client_phone TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Under Review',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()

    # Seed & Sync Admin Accounts with RBAC (admin.realestate@gmail.com, urbanscope.cvsu@gmail.com)
    from backend.auth import hash_password

    admin_pass = hash_password("realestate2026")
    superadmin_pass = hash_password("urbanscope2026")

    accounts_to_sync = [
        ("admin.realestate@gmail.com", admin_pass, "Miriam Lobren (Admin)", "+63 900 000 0000", "admin"),
        ("urbanscope.cvsu@gmail.com", superadmin_pass, "UrbanScope Superadmin (CvSU)", "+63 900 000 0000", "superadmin")
    ]

    for email, pwd_hash, full_name, phone, role in accounts_to_sync:
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        existing = cursor.fetchone()
        if existing:
            cursor.execute(
                "UPDATE users SET password_hash = ?, role = ?, full_name = ?, phone = ? WHERE id = ?",
                (pwd_hash, role, full_name, phone, existing[0])
            )
        else:
            cursor.execute(
                "INSERT INTO users (email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?)",
                (email, pwd_hash, full_name, phone, role)
            )

    # Demote any unauthorized user emails that may have been previously given admin role
    cursor.execute("""
        UPDATE users
        SET role = 'user'
        WHERE LOWER(email) NOT IN ('admin.realestate@gmail.com', 'urbanscope.cvsu@gmail.com')
          AND role != 'user'
    """)
    conn.commit()
    print("✓ RBAC credentials & database triggers verified (Superadmin: urbanscope.cvsu@gmail.com, Admin: admin.realestate@gmail.com)")

    # Purge legacy @example.com demo rows left behind by databases seeded before they were removed
    cursor.execute("DELETE FROM inquiries WHERE LOWER(client_email) LIKE '%@example.com'")
    purged_inquiries = cursor.rowcount
    cursor.execute("DELETE FROM users WHERE LOWER(email) LIKE '%@example.com'")
    purged_users = cursor.rowcount
    conn.commit()
    if purged_users or purged_inquiries:
        print(f"✓ Purged legacy demo data: {purged_users} @example.com user(s), {purged_inquiries} inquiry(ies)")

    # Seed Initial Properties
    cursor.execute("SELECT COUNT(*) FROM properties")
    prop_count = cursor.fetchone()[0]
    if prop_count == 0:
        properties_seed = [
            (
                "Velemont Residences",
                "Manuyo, Las Piñas City",
                "Subdivision",
                6880000,
                3,
                2,
                120,
                95,
                2,
                2,
                "Available",
                "assets/images/property1.jpg",
                "Modern suburban residence with spacious layout, 24/7 security, and convenient access to Metro Manila commercial hubs.",
                "24/7 Security, Clubhouse & Function Hall, Swimming Pool, Landscaped Parks, Perimeter Fence"
            ),
            (
                "Green Valley Villa",
                "Dasmariñas, Cavite",
                "Villa",
                5200000,
                3,
                2,
                95,
                82,
                1,
                2,
                "Available",
                "assets/images/property2.jpg",
                "Contemporary family villa featuring private vehicle parking, landscaped pocket gardens, and clubhouse amenities.",
                "Gated Community, Pocket Garden, Swimming Pool, Clubhouse, 24/7 Guardhouse"
            ),
            (
                "Horizon Heights",
                "Pamplona, Las Piñas City",
                "Condominium",
                3450000,
                1,
                1,
                42,
                42,
                1,
                15,
                "Available",
                "assets/images/property3.jpg",
                "High-rise condominium overlooking scenic city views, featuring rooftop infinity pool, fitness gym, and concierge.",
                "Infinity Pool, Rooftop Fitness Gym, Concierge Service, Passenger Elevators, CCTV Surveillance"
            ),
            (
                "Liora Homes Executive Townhouse",
                "Pasong Buaya II, Imus, Cavite",
                "Townhouse",
                2400000,
                2,
                1,
                48,
                43,
                1,
                2,
                "Available",
                "assets/images/LioraHomes.jpg",
                "Eco-friendly, modern townhouse community in Imus, Cavite equipped with solar-ready fixtures and community leisure facilities.",
                "Solar-Ready System, Eco-Friendly Lighting, Basketball Court, Children Playground, Multi-purpose Hall"
            ),
            (
                "Airmen Triplex Modern Residence",
                "Poblacion, Naic, Cavite",
                "Triplex",
                3100000,
                3,
                2,
                80,
                72,
                1,
                2,
                "Available",
                "assets/images/AirmenTriplex.WEBP",
                "Triplex residential home featuring a master balcony, built-in car garage, contemporary finishes, and proximity to major schools.",
                "Master Bedroom Balcony, Built-in Garage, Modern Kitchen Counter, Cable & Fiber Ready, Accessible to Transport"
            ),
            (
                "Sunset Heights Executive Townhouse",
                "Habay, Bacoor, Cavite",
                "Townhouse",
                3800000,
                3,
                2,
                100,
                75,
                1,
                2,
                "Available",
                "assets/images/property3.jpg",
                "Charming 2-storey executive townhouse in Bacoor with immediate access to expressways, schools, and shopping malls.",
                "24/7 Security, Clubhouse, Playground, Basketball Court"
            )
        ]

        cursor.executemany("""
            INSERT INTO properties (
                title, location, property_type, price,
                bedrooms, bathrooms, lot_area, floor_area, carports, storeys,
                status, image_url, description, amenities
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, properties_seed)
        conn.commit()
        print("✓ Database seeded with 5 initial featured properties")

    # Inquiries table is ready for client submissions

    conn.close()


def row_to_dict(row: sqlite3.Row) -> dict:
    """Converts a SQLite Row object to a standard Python dictionary."""
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}

import os
import sys
import sqlite3
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_DIR = os.path.join(BASE_DIR, 'database')
DB_PATH = os.path.join(DB_DIR, 'staynest.db')


def initialize_database():
    """Initialize the database with schema, triggers, and seed data."""
    # Ensure database directory exists
    os.makedirs(DB_DIR, exist_ok=True)

    # Remove existing database for fresh start
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Removed existing database.")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")

    # Execute schema
    schema_path = os.path.join(DB_DIR, 'schema.sql')
    print(f"Loading schema from {schema_path}...")
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    print("Schema created successfully.")

    # Execute seed data with proper password hashes
    print("Inserting seed data...")
    password_hash = generate_password_hash('Password123!')

    # Insert users with proper hashes
    users = [
        ('guest@staynest.com', password_hash, 'Arjun', 'Sharma', '+91', '9876543210', 'guest', 1, 'Love traveling and exploring new places.'),
        ('host1@staynest.com', password_hash, 'Priya', 'Patel', '+91', '9876543211', 'host', 1, 'Superhost with 5 years of experience hosting guests from around the world.'),
        ('host2@staynest.com', password_hash, 'Rahul', 'Mehta', '+91', '9876543212', 'host', 1, 'Passionate about providing the best stays in Goa.'),
        ('guest2@staynest.com', password_hash, 'Ananya', 'Gupta', '+91', '9876543213', 'guest', 1, 'Foodie and adventure seeker.'),
        ('admin@staynest.com', password_hash, 'Admin', 'StayNest', '+91', '9876543200', 'admin', 1, 'Platform administrator.'),
    ]

    conn.executemany(
        """INSERT INTO users (email, password_hash, first_name, last_name,
           phone_country_code, phone_number, role, is_verified, bio) VALUES (?,?,?,?,?,?,?,?,?)""",
        users
    )

    # Read and execute rest of seed data (skip the users INSERT since we handled it)
    seed_path = os.path.join(DB_DIR, 'seed_data.sql')
    with open(seed_path, 'r', encoding='utf-8') as f:
        seed_sql = f.read()

    # Split by statements and skip user inserts
    statements = seed_sql.split(';')
    for stmt in statements:
        stmt = stmt.strip()
        if stmt and 'INSERT INTO users' not in stmt:
            try:
                conn.execute(stmt)
            except sqlite3.Error as e:
                if 'already exists' not in str(e).lower() and 'unique' not in str(e).lower():
                    print(f"Warning: {e}")
                    print(f"Statement: {stmt[:100]}...")

    conn.commit()

    # Verify data
    tables = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    print(f"\nCreated {len(tables)} tables:")
    for table in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM [{table[0]}]").fetchone()[0]
        print(f"  - {table[0]}: {count} rows")

    # Verify triggers
    triggers = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='trigger'"
    ).fetchall()
    print(f"\nCreated {len(triggers)} triggers:")
    for trigger in triggers:
        print(f"  - {trigger[0]}")

    conn.close()
    print(f"\nDatabase initialized at: {DB_PATH}")
    print("Default password for all users: Password123!")
    print("\nTest accounts:")
    print("  Guest:  guest@staynest.com / Password123!")
    print("  Host:   host1@staynest.com / Password123!")
    print("  Host2:  host2@staynest.com / Password123!")
    print("  Admin:  admin@staynest.com / Password123!")


if __name__ == '__main__':
    initialize_database()

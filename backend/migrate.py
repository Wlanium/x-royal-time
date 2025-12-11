#!/usr/bin/env python3
"""
Simple migration script to add new columns to existing database.
Run this once after updating the code.
"""
import sqlite3
import os

DB_PATH = os.environ.get("DATABASE_PATH", "./data/app.db")

def migrate():
    print(f"Migrating database: {DB_PATH}")

    if not os.path.exists(DB_PATH):
        print("Database doesn't exist yet. It will be created on first run.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get existing columns for each table
    def get_columns(table):
        cursor.execute(f"PRAGMA table_info({table})")
        return [row[1] for row in cursor.fetchall()]

    migrations = []

    # Check employees table
    emp_cols = get_columns("employees")
    if "nickname" not in emp_cols:
        migrations.append(("employees", "nickname", "VARCHAR(100)"))

    # Check users table
    user_cols = get_columns("users")
    if "role" not in user_cols:
        migrations.append(("users", "role", "VARCHAR(20) DEFAULT 'employee'"))

    # Add missing columns
    for table, column, col_type in migrations:
        print(f"  Adding {table}.{column}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")

    # Create app_settings table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            display_name_format VARCHAR(20) DEFAULT 'full',
            updated_at TIMESTAMP
        )
    """)

    # Insert default settings if empty
    cursor.execute("SELECT COUNT(*) FROM app_settings")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO app_settings (id, display_name_format) VALUES (1, 'full')")
        print("  Created default app_settings")

    conn.commit()
    conn.close()

    if migrations:
        print(f"✓ Applied {len(migrations)} migrations")
    else:
        print("✓ Database is up to date")

if __name__ == "__main__":
    migrate()

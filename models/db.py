import sqlite3
import os
from config import Config


def get_db():
    """Get a database connection with row factory enabled."""
    db = sqlite3.connect(Config.DATABASE)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    db.execute("PRAGMA journal_mode = WAL")
    return db


def close_db(db):
    """Close database connection."""
    if db is not None:
        db.close()


def init_db():
    """Initialize database from schema.sql and seed_data.sql."""
    db_dir = os.path.dirname(Config.DATABASE)
    if not os.path.exists(db_dir):
        os.makedirs(db_dir)

    db = get_db()
    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'schema.sql')
    seed_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'seed_data.sql')

    with open(schema_path, 'r') as f:
        db.executescript(f.read())

    with open(seed_path, 'r') as f:
        db.executescript(f.read())

    db.commit()
    close_db(db)


def query_db(query, args=(), one=False):
    """Execute a query and return results."""
    db = get_db()
    try:
        cur = db.execute(query, args)
        rv = cur.fetchall()
        db.commit()
        return (rv[0] if rv else None) if one else rv
    finally:
        close_db(db)


def execute_db(query, args=()):
    """Execute a write query and return lastrowid."""
    db = get_db()
    try:
        cur = db.execute(query, args)
        db.commit()
        return cur.lastrowid
    finally:
        close_db(db)


def execute_many_db(query, args_list):
    """Execute a write query with many rows."""
    db = get_db()
    try:
        db.executemany(query, args_list)
        db.commit()
    finally:
        close_db(db)

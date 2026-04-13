import os
import time

import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash

from backend.migrations import run_migrations


class PGConnection:
    def __init__(self, dsn):
        self.conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
        self.conn.autocommit = False

    def execute(self, query, params=None):
        cur = self.conn.cursor()
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        return cur

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()


def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        dsn = "user=postgres password=postgres dbname=postgres host=localhost"
    return PGConnection(dsn)


def _is_password_hash(value: str) -> bool:
    if not isinstance(value, str):
        return False
    return value.startswith('pbkdf2:') or value.startswith('scrypt:') or value.startswith('argon2:')


def initialize_database():
    conn = get_db_connection()
    try:
        conn.execute("SELECT 1")
        applied_migrations = run_migrations(conn)

        row = conn.execute('SELECT * FROM usuarios WHERE "user" = \'admin\'').fetchone()
        if not row:
            admin_password = os.environ.get('ADMIN_PASSWORD')
            if not admin_password and os.environ.get('DATABASE_URL'):
                raise RuntimeError("ADMIN_PASSWORD environment variable is required when DATABASE_URL is configured.")
            if not admin_password:
                admin_password = 'admin123'
            now_ts = int(time.time())
            conn.execute(
                'INSERT INTO usuarios (id, "user", pass, role, ativo, tentativas, must_change_pass, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
                ('1', 'admin', generate_password_hash(admin_password), 'ADMIN', 1, 0, 1 if not os.environ.get('ADMIN_PASSWORD') else 0, now_ts)
            )
        else:
            conn.execute(
                "UPDATE usuarios SET created_at = COALESCE(created_at, %s) WHERE \"user\" = 'admin'",
                (int(time.time()),),
            )

        rows = conn.execute("SELECT id, pass FROM usuarios").fetchall()
        for row in rows:
            uid = row['id']
            pwd = row['pass'] or ''
            if pwd and not _is_password_hash(pwd):
                conn.execute("UPDATE usuarios SET pass = %s WHERE id = %s", (generate_password_hash(pwd), uid))
            conn.execute(
                "UPDATE usuarios SET created_at = COALESCE(created_at, %s) WHERE id = %s",
                (int(time.time()), uid),
            )

        conn.commit()
        return {"applied_migrations": applied_migrations}
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

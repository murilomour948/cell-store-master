import time

from backend.migrations.versions.v001_initial_schema import MIGRATION as V001_INITIAL_SCHEMA


MIGRATIONS = [
    V001_INITIAL_SCHEMA,
]


def run_migrations(conn):
    conn.execute(
        '''
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at BIGINT NOT NULL
        )
        '''
    )
    applied_rows = conn.execute(
        "SELECT version FROM schema_migrations ORDER BY version"
    ).fetchall()
    applied_versions = {row["version"] for row in applied_rows}
    applied_now = []

    for migration in MIGRATIONS:
        if migration.version in applied_versions:
            continue
        migration.apply(conn)
        conn.execute(
            "INSERT INTO schema_migrations (version, name, applied_at) VALUES (%s, %s, %s)",
            (migration.version, migration.name, int(time.time())),
        )
        applied_now.append(migration.version)

    return applied_now

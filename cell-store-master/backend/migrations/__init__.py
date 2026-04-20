import time

try:
    from backend.migrations.versions.v001_initial_schema import MIGRATION as V001_INITIAL_SCHEMA
    from backend.migrations.versions.v002_produtos_metadata import MIGRATION as V002_PRODUTOS_METADATA
    from backend.migrations.versions.v003_acessorios_estoque_minimo import MIGRATION as V003_ACESSORIOS_ESTOQUE_MINIMO
except ModuleNotFoundError:
    from migrations.versions.v001_initial_schema import MIGRATION as V001_INITIAL_SCHEMA
    from migrations.versions.v002_produtos_metadata import MIGRATION as V002_PRODUTOS_METADATA
    from migrations.versions.v003_acessorios_estoque_minimo import MIGRATION as V003_ACESSORIOS_ESTOQUE_MINIMO

MIGRATION_LOCK_ID = 424242

MIGRATIONS = [
    V001_INITIAL_SCHEMA,
    V002_PRODUTOS_METADATA,
    V003_ACESSORIOS_ESTOQUE_MINIMO,
]


def run_migrations(conn):
    conn.execute("SELECT pg_advisory_lock(%s)", (MIGRATION_LOCK_ID,))
    try:
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
    finally:
        conn.execute("SELECT pg_advisory_unlock(%s)", (MIGRATION_LOCK_ID,))

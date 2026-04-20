try:
    from backend.migrations.base import Migration
except ModuleNotFoundError:
    from migrations.base import Migration


def _table_has_column(conn, table_name, column_name):
    row = conn.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = %s AND column_name = %s
        """,
        (table_name, column_name.lower()),
    ).fetchone()
    return bool(row)


def apply(conn):
    if not _table_has_column(conn, "acessorios", "estoqueminimo"):
        conn.execute("ALTER TABLE acessorios ADD COLUMN estoqueMinimo INTEGER DEFAULT 2")
    conn.execute("UPDATE acessorios SET estoqueMinimo = COALESCE(estoqueMinimo, 2)")


MIGRATION = Migration(
    version="003",
    name="acessorios_estoque_minimo",
    apply=apply,
)

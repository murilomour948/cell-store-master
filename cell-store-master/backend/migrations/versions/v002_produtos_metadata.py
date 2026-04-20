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
    alter_steps = [
        ("produtos", "capacidade", "ALTER TABLE produtos ADD COLUMN capacidade TEXT"),
        ("produtos", "bateria", "ALTER TABLE produtos ADD COLUMN bateria TEXT"),
        ("produtos", "garantia", "ALTER TABLE produtos ADD COLUMN garantia TEXT"),
        ("produtos", "origem", "ALTER TABLE produtos ADD COLUMN origem TEXT"),
        ("produtos", "fornecedor", "ALTER TABLE produtos ADD COLUMN fornecedor TEXT"),
    ]

    for table_name, column_name, query in alter_steps:
        if not _table_has_column(conn, table_name, column_name):
            conn.execute(query)


MIGRATION = Migration(
    version="002",
    name="produtos_metadata",
    apply=apply,
)

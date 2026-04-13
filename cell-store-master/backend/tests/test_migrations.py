import unittest

from backend.migrations import run_migrations


class _Cursor:
    def __init__(self, rows=None):
        self._rows = list(rows or [])

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)


class _RecordingConnection:
    def __init__(self, applied_versions=None, columns=None):
        self.applied_versions = list(applied_versions or [])
        self.columns = columns or {}
        self.queries = []

    def execute(self, query, params=None):
        sql = " ".join(query.strip().split()).lower()
        self.queries.append((sql, params))

        if sql == "select version from schema_migrations order by version":
            return _Cursor([{"version": version} for version in self.applied_versions])

        if "from information_schema.columns" in sql:
            table_name, column_name = params
            exists = column_name in self.columns.get(table_name, set())
            return _Cursor([{"column_name": column_name}] if exists else [])

        if sql.startswith("insert into schema_migrations"):
            self.applied_versions.append(params[0])
            return _Cursor()

        return _Cursor()


class MigrationRunnerTests(unittest.TestCase):
    def test_applies_pending_migration_and_records_version(self):
        conn = _RecordingConnection()

        applied = run_migrations(conn)

        self.assertEqual(applied, ["001"])
        self.assertIn("001", conn.applied_versions)
        self.assertTrue(any("create table if not exists produtos" in sql for sql, _ in conn.queries))
        self.assertTrue(any("create table if not exists schema_migrations" in sql for sql, _ in conn.queries))

    def test_skips_already_applied_migrations(self):
        conn = _RecordingConnection(applied_versions=["001"])

        applied = run_migrations(conn)

        self.assertEqual(applied, [])
        inserts = [sql for sql, _ in conn.queries if sql.startswith("insert into schema_migrations")]
        self.assertEqual(inserts, [])

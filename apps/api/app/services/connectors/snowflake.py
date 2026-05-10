from __future__ import annotations

from typing import Any

from app.services.connectors.base import (
    CatalogInventory,
    ColumnInfo,
    DataConnector,
    LineageEdge,
    PipelineInfo,
    SchemaInfo,
    TableInfo,
)


class SnowflakeConnector(DataConnector):
    """Reads INFORMATION_SCHEMA / ACCOUNT_USAGE views via snowflake-connector-python.

    Required config keys: account, user, password. Optional: warehouse, role, database.
    """

    source = "snowflake"

    def _connect(self):
        import snowflake.connector

        required = ["account", "user", "password"]
        missing = [k for k in required if not self.config.get(k)]
        if missing:
            raise ValueError(f"Snowflake connector missing config: {missing}")

        return snowflake.connector.connect(
            account=self.config["account"],
            user=self.config["user"],
            password=self.config["password"],
            warehouse=self.config.get("warehouse"),
            role=self.config.get("role"),
            database=self.config.get("database"),
            client_session_keep_alive=False,
        )

    def test_connection(self) -> tuple[bool, str]:
        try:
            conn = self._connect()
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT CURRENT_USER(), CURRENT_ACCOUNT(), CURRENT_VERSION()")
                    user, account, version = cur.fetchone()
                return True, f"Connected as {user} on {account} (Snowflake {version})"
            finally:
                conn.close()
        except Exception as exc:  # noqa: BLE001
            return False, f"Snowflake connection failed: {exc}"

    def scan(self, *, max_tables: int = 500) -> CatalogInventory:
        conn = self._connect()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT TABLE_CATALOG, TABLE_SCHEMA, COMMENT
                    FROM SNOWFLAKE.ACCOUNT_USAGE.SCHEMATA
                    WHERE DELETED IS NULL
                    """
                )
                schemas = [
                    SchemaInfo(catalog=cat, name=name, description=comment, table_count=0)
                    for cat, name, comment in cur.fetchall()
                ]

                cur.execute(
                    f"""
                    SELECT TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COMMENT,
                           ROW_COUNT, BYTES, TABLE_TYPE, LAST_ALTERED
                    FROM SNOWFLAKE.ACCOUNT_USAGE.TABLES
                    WHERE DELETED IS NULL
                    LIMIT {int(max_tables)}
                    """
                )
                table_rows = cur.fetchall()

                tables: list[TableInfo] = []
                for cat, sch, name, comment, rows, bytes_, ttype, last_altered in table_rows:
                    cur.execute(
                        """
                        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COMMENT
                        FROM SNOWFLAKE.ACCOUNT_USAGE.COLUMNS
                        WHERE TABLE_CATALOG = %s
                          AND TABLE_SCHEMA = %s
                          AND TABLE_NAME = %s
                          AND DELETED IS NULL
                        """,
                        (cat, sch, name),
                    )
                    columns = [
                        ColumnInfo(
                            name=cn,
                            data_type=dt,
                            nullable=(nullable == "YES"),
                            description=cc,
                        )
                        for cn, dt, nullable, cc in cur.fetchall()
                    ]
                    tables.append(
                        TableInfo(
                            catalog=cat,
                            schema=sch,
                            name=name,
                            description=comment,
                            row_count=rows,
                            size_bytes=bytes_,
                            columns=columns,
                            last_modified=str(last_altered) if last_altered else None,
                            table_type=ttype or "TABLE",
                            storage_format="snowflake",
                        )
                    )

                cur.execute(
                    """
                    SELECT NAME, SCHEDULE, STATE
                    FROM SNOWFLAKE.ACCOUNT_USAGE.TASK_HISTORY
                    LIMIT 50
                    """
                )
                pipelines = [
                    PipelineInfo(
                        id=name, name=name, type="task", last_run_status=state, schedule=schedule
                    )
                    for name, schedule, state in cur.fetchall()
                ]
        finally:
            conn.close()

        return CatalogInventory(
            source=self.source,
            workspace=self.config.get("account"),
            schemas=schemas,
            tables=tables,
            pipelines=pipelines,
            lineage=[],
            raw={},
        )

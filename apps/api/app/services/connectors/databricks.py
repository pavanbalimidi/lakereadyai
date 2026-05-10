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


class DatabricksConnector(DataConnector):
    """Reads Unity Catalog metadata via the Databricks SDK.

    Required config keys: host, token. Optional: warehouse_id, catalogs (list).
    """

    source = "databricks"

    def _client(self):
        # Imported lazily so the API can boot without the SDK installed yet.
        from databricks.sdk import WorkspaceClient

        host = self.config.get("host")
        token = self.config.get("token")
        if not host or not token:
            raise ValueError("Databricks connector requires `host` and `token` in config.")
        return WorkspaceClient(host=host, token=token)

    def test_connection(self) -> tuple[bool, str]:
        try:
            client = self._client()
            me = client.current_user.me()
            return True, f"Connected as {me.user_name} on {self.config.get('host')}"
        except Exception as exc:  # noqa: BLE001 - surfaced to user
            return False, f"Databricks connection failed: {exc}"

    def scan(self, *, max_tables: int = 500) -> CatalogInventory:
        client = self._client()
        catalogs_filter: list[str] | None = self.config.get("catalogs")

        schemas: list[SchemaInfo] = []
        tables: list[TableInfo] = []

        catalogs = list(client.catalogs.list())
        for catalog in catalogs:
            if catalogs_filter and catalog.name not in catalogs_filter:
                continue
            for schema in client.schemas.list(catalog_name=catalog.name):
                schemas.append(
                    SchemaInfo(
                        catalog=catalog.name,
                        name=schema.name,
                        description=schema.comment,
                        table_count=0,
                    )
                )
                for tbl in client.tables.list(
                    catalog_name=catalog.name, schema_name=schema.name
                ):
                    if len(tables) >= max_tables:
                        break
                    columns = [
                        ColumnInfo(
                            name=c.name,
                            data_type=c.type_text or c.type_name or "UNKNOWN",
                            nullable=bool(getattr(c, "nullable", True)),
                            description=c.comment,
                        )
                        for c in (tbl.columns or [])
                    ]
                    tables.append(
                        TableInfo(
                            catalog=catalog.name,
                            schema=schema.name,
                            name=tbl.name,
                            description=tbl.comment,
                            row_count=None,
                            size_bytes=None,
                            columns=columns,
                            last_modified=str(tbl.updated_at) if tbl.updated_at else None,
                            table_type=str(tbl.table_type) if tbl.table_type else "TABLE",
                            storage_format=str(tbl.data_source_format)
                            if tbl.data_source_format
                            else None,
                            tags=[],
                        )
                    )
                if len(tables) >= max_tables:
                    break

        pipelines: list[PipelineInfo] = []
        try:
            for job in client.jobs.list(limit=50):
                pipelines.append(
                    PipelineInfo(
                        id=str(job.job_id),
                        name=job.settings.name if job.settings else f"job-{job.job_id}",
                        type="job",
                        last_run_status=None,
                        schedule=None,
                    )
                )
        except Exception:  # noqa: BLE001 - jobs perm may be missing
            pass

        lineage: list[LineageEdge] = []  # Phase 2: pull from system.access.table_lineage

        return CatalogInventory(
            source=self.source,
            workspace=self.config.get("host"),
            schemas=schemas,
            tables=tables,
            pipelines=pipelines,
            lineage=lineage,
            raw={"catalogs_seen": [c.name for c in catalogs]},
        )

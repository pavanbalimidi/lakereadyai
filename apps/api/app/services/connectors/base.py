from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ColumnInfo:
    name: str
    data_type: str
    nullable: bool = True
    description: str | None = None
    is_pii: bool | None = None  # connector-detected hint, refined later
    tags: list[str] = field(default_factory=list)


@dataclass
class TableInfo:
    catalog: str | None
    schema: str
    name: str
    description: str | None
    row_count: int | None
    size_bytes: int | None
    columns: list[ColumnInfo]
    last_modified: str | None = None
    table_type: str = "TABLE"  # TABLE | VIEW | MATERIALIZED_VIEW | EXTERNAL
    storage_format: str | None = None  # delta, parquet, iceberg, etc.
    tags: list[str] = field(default_factory=list)
    has_primary_key: bool = False
    partitioned: bool = False


@dataclass
class SchemaInfo:
    catalog: str | None
    name: str
    description: str | None
    table_count: int


@dataclass
class PipelineInfo:
    id: str
    name: str
    type: str  # job, dlt, dbt_model, snowpipe, task
    last_run_status: str | None
    schedule: str | None


@dataclass
class LineageEdge:
    upstream: str  # fully qualified name
    downstream: str


@dataclass
class CatalogInventory:
    """Snapshot of the data platform produced by a connector scan."""

    source: str  # "databricks" | "snowflake" | "mock"
    workspace: str | None
    schemas: list[SchemaInfo]
    tables: list[TableInfo]
    pipelines: list[PipelineInfo]
    lineage: list[LineageEdge]
    raw: dict[str, Any] = field(default_factory=dict)


class DataConnector(ABC):
    """Pluggable connector for an enterprise data platform.

    Implementations must be safe to call from a Celery worker. They should not
    assume an event loop is running.
    """

    source: str = "unknown"

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

    @abstractmethod
    def test_connection(self) -> tuple[bool, str]:
        """Return (ok, human-readable message)."""

    @abstractmethod
    def scan(self, *, max_tables: int = 500) -> CatalogInventory:
        """Walk the catalog and return an inventory snapshot."""

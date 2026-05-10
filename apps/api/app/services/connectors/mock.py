from __future__ import annotations

import random
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

PII_HINTS = {"email", "ssn", "phone", "dob", "credit_card", "address", "ip_address"}


class MockConnector(DataConnector):
    """Generates a realistic synthetic catalog for demos without credentials."""

    source = "mock"

    def test_connection(self) -> tuple[bool, str]:
        return True, "Mock connector ready (no credentials required)."

    def scan(self, *, max_tables: int = 500) -> CatalogInventory:
        rng = random.Random(self.config.get("seed", 42))

        schemas = [
            SchemaInfo(catalog="main", name="bronze", description=None, table_count=12),
            SchemaInfo(catalog="main", name="silver", description="Cleaned data", table_count=18),
            SchemaInfo(
                catalog="main",
                name="gold",
                description="Business-ready aggregates",
                table_count=8,
            ),
            SchemaInfo(catalog="main", name="raw_ingest", description=None, table_count=22),
        ]

        templates = [
            ("bronze", "txn_tbl", ["id", "user_id", "amount", "ts", "cc_num"], False),
            ("bronze", "cust_tbl", ["id", "name", "email", "phone", "dob"], False),
            ("bronze", "acct_tbl", ["id", "user_id", "balance", "opened_on"], False),
            ("silver", "transactions", ["id", "user_id", "amount_usd", "merchant", "ts"], True),
            ("silver", "customers", ["id", "full_name", "email_hash", "country"], True),
            ("silver", "accounts", ["id", "customer_id", "balance_usd", "status"], True),
            ("gold", "customer_360", ["customer_id", "ltv", "risk_band", "segment"], True),
            ("gold", "fraud_signals", ["txn_id", "score", "rule_set", "flagged"], True),
            ("raw_ingest", "events_clickstream", ["event_id", "user_id", "url", "ip"], False),
            ("raw_ingest", "logs_app", ["ts", "level", "message", "trace_id"], False),
            ("raw_ingest", "vendor_dump_a", ["c1", "c2", "c3", "c4"], False),
            ("raw_ingest", "vendor_dump_b", ["a", "b", "c"], False),
        ]

        tables: list[TableInfo] = []
        for schema, name, cols, has_doc in templates:
            columns = [
                ColumnInfo(
                    name=c,
                    data_type=rng.choice(["STRING", "BIGINT", "DOUBLE", "TIMESTAMP", "DECIMAL"]),
                    nullable=rng.random() > 0.3,
                    description=("documented column" if has_doc and rng.random() > 0.4 else None),
                    is_pii=any(hint in c.lower() for hint in PII_HINTS) or None,
                )
                for c in cols
            ]
            tables.append(
                TableInfo(
                    catalog="main",
                    schema=schema,
                    name=name,
                    description=("Curated table" if has_doc else None),
                    row_count=rng.randint(10_000, 50_000_000),
                    size_bytes=rng.randint(1_000_000, 500_000_000_000),
                    columns=columns,
                    last_modified=None,
                    table_type="TABLE",
                    storage_format="delta" if schema != "raw_ingest" else "parquet",
                    tags=["pii"] if any(c.is_pii for c in columns) else [],
                    has_primary_key=has_doc,
                    partitioned=rng.random() > 0.5,
                )
            )

        pipelines = [
            PipelineInfo(id="job-101", name="bronze_ingest_daily", type="job",
                         last_run_status="SUCCESS", schedule="0 2 * * *"),
            PipelineInfo(id="dlt-7", name="silver_transformations", type="dlt",
                         last_run_status="FAILED", schedule="0 3 * * *"),
            PipelineInfo(id="job-204", name="gold_customer360_refresh", type="job",
                         last_run_status="SUCCESS", schedule="0 4 * * *"),
            PipelineInfo(id="dbt-12", name="dbt_marts", type="dbt_model",
                         last_run_status="SUCCESS", schedule=None),
        ]

        lineage = [
            LineageEdge(upstream="main.bronze.txn_tbl", downstream="main.silver.transactions"),
            LineageEdge(upstream="main.bronze.cust_tbl", downstream="main.silver.customers"),
            LineageEdge(upstream="main.bronze.acct_tbl", downstream="main.silver.accounts"),
            LineageEdge(
                upstream="main.silver.transactions", downstream="main.gold.fraud_signals"
            ),
            LineageEdge(upstream="main.silver.customers", downstream="main.gold.customer_360"),
        ]

        return CatalogInventory(
            source=self.source,
            workspace="mock-workspace",
            schemas=schemas,
            tables=tables[:max_tables],
            pipelines=pipelines,
            lineage=lineage,
            raw={"note": "synthetic data generated by MockConnector"},
        )

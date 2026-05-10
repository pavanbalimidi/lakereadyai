"""Deterministic AI Readiness scoring engine.

Operates on a CatalogInventory (vendor-neutral) and produces sub-scores per pillar,
findings, and recommendations. The AI analyzer (services/ai_analyzer.py) augments
this with narrative + prioritized recommendations using Claude.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.services.connectors.base import CatalogInventory, ColumnInfo, TableInfo

PII_PATTERNS = [
    re.compile(r"\b(ssn|social.?security)\b", re.I),
    re.compile(r"\bemail\b", re.I),
    re.compile(r"\bphone\b", re.I),
    re.compile(r"\b(dob|birth.?date)\b", re.I),
    re.compile(r"\b(credit.?card|cc.?num|card.?number)\b", re.I),
    re.compile(r"\b(address|zip.?code|postal)\b", re.I),
    re.compile(r"\bip.?address\b", re.I),
    re.compile(r"\bpassport\b", re.I),
]

PILLAR_WEIGHTS = {
    "metadata": 0.20,
    "schema_quality": 0.20,
    "governance": 0.20,
    "rag_readiness": 0.20,
    "semantic_layer": 0.10,
    "operational_health": 0.10,
}


@dataclass
class Finding:
    id: str
    severity: str
    title: str
    description: str
    evidence: list[str] = field(default_factory=list)


@dataclass
class Recommendation:
    id: str
    priority: str
    title: str
    description: str
    effort: str


@dataclass
class ScoreResult:
    readiness_score: int
    rag_readiness_score: int
    semantic_maturity_score: int
    pillars: dict[str, int]
    findings: list[Finding]
    recommendations: list[Recommendation]
    inventory_stats: dict


def _is_pii_column(col: ColumnInfo) -> bool:
    if col.is_pii:
        return True
    return any(p.search(col.name) for p in PII_PATTERNS)


def _is_documented(value: str | None) -> bool:
    return bool(value and value.strip() and len(value.strip()) >= 8)


def _table_fqn(t: TableInfo) -> str:
    parts = [p for p in [t.catalog, t.schema, t.name] if p]
    return ".".join(parts)


def score_inventory(inv: CatalogInventory) -> ScoreResult:
    findings: list[Finding] = []
    recs: list[Recommendation] = []

    total_tables = len(inv.tables) or 1
    documented_tables = sum(1 for t in inv.tables if _is_documented(t.description))
    total_columns = sum(len(t.columns) for t in inv.tables) or 1
    documented_columns = sum(
        1 for t in inv.tables for c in t.columns if _is_documented(c.description)
    )
    pii_columns = [
        (t, c) for t in inv.tables for c in t.columns if _is_pii_column(c)
    ]
    untagged_pii = [
        (t, c) for t, c in pii_columns if "pii" not in {x.lower() for x in (t.tags or [])}
    ]
    delta_or_iceberg = sum(
        1 for t in inv.tables if (t.storage_format or "").lower() in {"delta", "iceberg"}
    )
    large_unoptimized = [
        t
        for t in inv.tables
        if (t.size_bytes or 0) > 50 * 1024**3 and not t.partitioned
    ]
    pk_count = sum(1 for t in inv.tables if t.has_primary_key)

    # ---- Pillar: metadata coverage ----
    metadata_score = int(
        100 * (0.5 * documented_tables / total_tables + 0.5 * documented_columns / total_columns)
    )
    if documented_tables / total_tables < 0.6:
        findings.append(
            Finding(
                id="meta-missing-table-desc",
                severity="high",
                title=f"{total_tables - documented_tables} of {total_tables} tables lack descriptions",
                description=(
                    "Without table-level descriptions, retrieval and entity inference cannot "
                    "ground answers reliably. AI agents will hallucinate semantics."
                ),
                evidence=[_table_fqn(t) for t in inv.tables if not _is_documented(t.description)][
                    :10
                ],
            )
        )
        recs.append(
            Recommendation(
                id="meta-autodoc",
                priority="high",
                title="Auto-generate table & column descriptions",
                description=(
                    "Use Claude to draft descriptions from schema + sample rows, then route to "
                    "data owners for one-click approval. Targets >90% coverage in days, not months."
                ),
                effort="medium",
            )
        )

    # ---- Pillar: schema quality ----
    schema_score = 100
    if pk_count / total_tables < 0.4:
        schema_score -= 30
        findings.append(
            Finding(
                id="schema-no-pk",
                severity="medium",
                title="Most tables lack primary keys",
                description=(
                    "Entity resolution and deduplication require stable keys. Many AI use cases "
                    "(Customer360, fraud) will fail or double-count without them."
                ),
            )
        )
    if large_unoptimized:
        schema_score -= 20
        findings.append(
            Finding(
                id="schema-unoptimized-large",
                severity="medium",
                title=f"{len(large_unoptimized)} large tables are unpartitioned",
                description=(
                    "Tables >50GB without partitioning lead to expensive scans and slow vector "
                    "indexing. Recommend Z-ORDER / clustering or partitioning by event date."
                ),
                evidence=[_table_fqn(t) for t in large_unoptimized][:10],
            )
        )
        recs.append(
            Recommendation(
                id="opt-delta-layout",
                priority="medium",
                title="Optimize Delta/Iceberg layouts",
                description=(
                    "Partition + Z-ORDER large tables; run OPTIMIZE/COMPACT; vacuum stale files. "
                    "Cuts scan cost and unlocks streaming embedding generation."
                ),
                effort="low",
            )
        )
    schema_score = max(0, schema_score)

    # ---- Pillar: governance / PII ----
    governance_score = 100
    if untagged_pii:
        ratio = len(untagged_pii) / max(1, len(pii_columns))
        governance_score -= int(60 * ratio)
        findings.append(
            Finding(
                id="gov-pii-untagged",
                severity="critical" if ratio > 0.5 else "high",
                title=f"{len(untagged_pii)} likely-PII columns without governance tags",
                description=(
                    "AI features built over untagged PII risk regulatory exposure (GDPR/CCPA/HIPAA). "
                    "Tag at the column level and enforce row/column masking before exposure to LLMs."
                ),
                evidence=[f"{_table_fqn(t)}.{c.name}" for t, c in untagged_pii][:10],
            )
        )
        recs.append(
            Recommendation(
                id="gov-tag-pii",
                priority="high",
                title="Tag and mask PII columns",
                description=(
                    "Auto-classify with regex + Claude review; apply column masks; route exposure "
                    "decisions through a single policy layer (Unity Catalog tags or Snowflake "
                    "tag-based masking)."
                ),
                effort="medium",
            )
        )
    governance_score = max(0, governance_score)

    # ---- Pillar: RAG readiness ----
    has_unstructured = any(
        any(c.data_type.upper() in {"STRING", "VARCHAR", "TEXT"} for c in t.columns)
        for t in inv.tables
    )
    rag_score = 0
    if has_unstructured:
        rag_score += 40
    if delta_or_iceberg / total_tables > 0.5:
        rag_score += 20
    # Vector index detection (heuristic: explicit tags or column types)
    has_vector_index = any(
        "vector" in (t.tags or []) or any("vector" in c.data_type.lower() for c in t.columns)
        for t in inv.tables
    )
    if has_vector_index:
        rag_score += 40
    else:
        findings.append(
            Finding(
                id="rag-no-vector-index",
                severity="high",
                title="No vector index detected",
                description=(
                    "Without vector indices, retrieval-augmented generation must scan documents "
                    "at query time — slow and expensive. Build embeddings into Delta/Snowflake "
                    "with auto-refresh."
                ),
            )
        )
        recs.append(
            Recommendation(
                id="rag-build-index",
                priority="high",
                title="Build vector indices for unstructured columns",
                description=(
                    "Identify high-value text columns, chunk + embed with a 1024-dim model, "
                    "and store with table-level lineage so retrieval stays grounded."
                ),
                effort="medium",
            )
        )
    rag_score = min(100, rag_score)

    # ---- Pillar: semantic layer ----
    has_gold = any((t.schema or "").lower() in {"gold", "marts", "semantic"} for t in inv.tables)
    has_business_terms = any(t.tags for t in inv.tables)
    semantic_score = (50 if has_gold else 0) + (50 if has_business_terms else 0)
    if semantic_score < 50:
        findings.append(
            Finding(
                id="sem-no-layer",
                severity="medium",
                title="No semantic / business layer detected",
                description=(
                    "Raw tables expose engineering names, not business concepts. AI agents "
                    "answering 'top customers by LTV' cannot reliably resolve the question."
                ),
            )
        )
        recs.append(
            Recommendation(
                id="sem-build-customer360",
                priority="medium",
                title="Build a semantic layer (Customer360, Revenue, Risk)",
                description=(
                    "Use Phase 2 of the platform to auto-derive business entities from schema + "
                    "lineage, then expose them as the canonical interface for AI agents."
                ),
                effort="high",
            )
        )

    # ---- Pillar: operational health ----
    failed_pipelines = [p for p in inv.pipelines if (p.last_run_status or "").upper() == "FAILED"]
    op_score = 100
    if failed_pipelines:
        op_score -= min(60, 20 * len(failed_pipelines))
        findings.append(
            Finding(
                id="ops-failed-pipelines",
                severity="medium",
                title=f"{len(failed_pipelines)} failed pipelines on last run",
                description=(
                    "Stale data degrades AI output silently. Wire failure alerts to data owners "
                    "and surface freshness SLAs alongside AI features."
                ),
                evidence=[p.name for p in failed_pipelines][:10],
            )
        )
    if not inv.lineage:
        op_score -= 20
        findings.append(
            Finding(
                id="ops-no-lineage",
                severity="medium",
                title="No lineage captured",
                description=(
                    "Without lineage, you cannot explain how an AI answer was derived — a hard "
                    "blocker for regulated industries."
                ),
            )
        )
    op_score = max(0, op_score)

    pillars = {
        "metadata": metadata_score,
        "schema_quality": schema_score,
        "governance": governance_score,
        "rag_readiness": rag_score,
        "semantic_layer": semantic_score,
        "operational_health": op_score,
    }
    readiness = int(sum(PILLAR_WEIGHTS[k] * v for k, v in pillars.items()))

    inventory_stats = {
        "schemas": len(inv.schemas),
        "tables": len(inv.tables),
        "columns": total_columns,
        "documented_tables_pct": int(100 * documented_tables / total_tables),
        "documented_columns_pct": int(100 * documented_columns / total_columns),
        "pii_columns": len(pii_columns),
        "untagged_pii_columns": len(untagged_pii),
        "pipelines": len(inv.pipelines),
        "failed_pipelines": len(failed_pipelines),
        "lineage_edges": len(inv.lineage),
        "delta_or_iceberg_tables": delta_or_iceberg,
        "total_size_bytes": sum(t.size_bytes or 0 for t in inv.tables),
    }

    return ScoreResult(
        readiness_score=readiness,
        rag_readiness_score=rag_score,
        semantic_maturity_score=semantic_score,
        pillars=pillars,
        findings=findings,
        recommendations=recs,
        inventory_stats=inventory_stats,
    )

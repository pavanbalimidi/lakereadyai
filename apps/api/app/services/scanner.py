"""Scanner orchestration: connector → scoring → AI augmentation → persisted report."""

from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.logging import log
from app.models import Connection, Report, Scan, ScanStatus
from app.services.ai_analyzer import augment_report
from app.services.connectors import get_connector
from app.services.scoring import score_inventory


def run_scan(db: Session, scan_id: UUID) -> None:
    scan = db.get(Scan, scan_id)
    if not scan:
        log.error("scan_not_found", scan_id=str(scan_id))
        return
    connection = db.get(Connection, scan.connection_id)
    if not connection:
        scan.status = ScanStatus.FAILED
        scan.error = "Connection not found"
        db.commit()
        return

    scan.status = ScanStatus.RUNNING
    scan.started_at = datetime.utcnow()
    scan.progress = 5
    db.commit()

    try:
        connector = get_connector(connection.type, connection.config or {})
        scan.progress = 20
        db.commit()

        inventory = connector.scan(max_tables=int(connection.config.get("max_tables", 500)))
        scan.progress = 60
        db.commit()

        score = score_inventory(inventory)
        scan.progress = 80
        db.commit()

        augmentation = augment_report(inventory, score)

        # Merge augmentation into findings/recommendations
        findings = [asdict(f) for f in score.findings]
        for extra in augmentation.get("extra_findings", []) or []:
            findings.append(extra)

        recs = [asdict(r) for r in score.recommendations]
        rewrites = {r.get("id"): r for r in augmentation.get("rewritten_recommendations", []) or []}
        for r in recs:
            if r["id"] in rewrites:
                rw = rewrites[r["id"]]
                r["title"] = rw.get("title", r["title"])
                r["description"] = rw.get("description", r["description"])
        for extra in augmentation.get("extra_recommendations", []) or []:
            recs.append(extra)

        pillars = [
            {"id": k, "name": k.replace("_", " ").title(), "score": v, "weight": 0.0}
            for k, v in score.pillars.items()
        ]

        report = Report(
            scan_id=scan.id,
            readiness_score=score.readiness_score,
            rag_readiness_score=score.rag_readiness_score,
            semantic_maturity_score=score.semantic_maturity_score,
            pillars=pillars,
            findings=findings,
            recommendations=recs,
            inventory={
                "stats": score.inventory_stats,
                "narrative": augmentation.get("narrative"),
                "source": inventory.source,
                "workspace": inventory.workspace,
            },
        )
        db.add(report)

        scan.summary = {
            "readiness_score": score.readiness_score,
            "tables": score.inventory_stats["tables"],
            "findings_count": len(findings),
            "recommendations_count": len(recs),
        }
        scan.status = ScanStatus.SUCCEEDED
        scan.progress = 100
        scan.finished_at = datetime.utcnow()
        db.commit()
        log.info("scan_succeeded", scan_id=str(scan_id), score=score.readiness_score)
    except Exception as exc:  # noqa: BLE001
        log.exception("scan_failed", scan_id=str(scan_id))
        scan.status = ScanStatus.FAILED
        scan.error = str(exc)[:2000]
        scan.finished_at = datetime.utcnow()
        db.commit()

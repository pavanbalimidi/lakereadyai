"""AI augmentation layer.

Uses Claude (claude-opus-4-7) to:
  - re-rank and rewrite findings into stakeholder-ready language,
  - propose additional recommendations grounded in the inventory snapshot,
  - generate an executive narrative summary.

Falls back gracefully when ANTHROPIC_API_KEY is not set: the deterministic
scoring output is returned unchanged.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from typing import Any

from app.config import get_settings
from app.logging import log
from app.services.connectors.base import CatalogInventory
from app.services.scoring import ScoreResult

SYSTEM_PROMPT = """You are an enterprise AI Readiness analyst. You review data platform \
metadata snapshots and turn them into crisp, prioritized recommendations for executives \
(CDOs, VPs of Data) and senior engineers.

You always respond with strict JSON matching the schema the user gives you. Do not \
include markdown, prose, or commentary outside the JSON object."""

USER_TEMPLATE = """Inventory snapshot (truncated):
{inventory_json}

Deterministic scoring already produced:
- readiness_score: {readiness}
- pillars: {pillars}
- findings: {findings}
- recommendations: {recs}

Augment the report. Return JSON of the form:
{{
  "narrative": "<2-3 sentence executive summary, no fluff>",
  "extra_findings": [{{"id":"...","severity":"low|medium|high|critical","title":"...","description":"...","evidence":[]}}],
  "extra_recommendations": [{{"id":"...","priority":"low|medium|high","title":"...","description":"...","effort":"low|medium|high"}}],
  "rewritten_recommendations": [{{"id":"<existing id>","title":"...","description":"..."}}]
}}

Rules:
- Be specific to THIS inventory; reference table or schema names.
- No more than 3 extra findings and 3 extra recommendations.
- Each description <= 280 chars."""


def augment_report(inv: CatalogInventory, score: ScoreResult) -> dict[str, Any]:
    settings = get_settings()
    if not settings.anthropic_api_key:
        log.info("ai_analyzer_skipped", reason="no_api_key")
        return {
            "narrative": _fallback_narrative(score),
            "extra_findings": [],
            "extra_recommendations": [],
            "rewritten_recommendations": [],
        }

    try:
        from anthropic import Anthropic
    except ImportError:
        log.warning("ai_analyzer_skipped", reason="anthropic_sdk_missing")
        return {"narrative": _fallback_narrative(score), "extra_findings": [],
                "extra_recommendations": [], "rewritten_recommendations": []}

    client = Anthropic(api_key=settings.anthropic_api_key)

    inventory_json = json.dumps(
        {
            "source": inv.source,
            "workspace": inv.workspace,
            "stats": score.inventory_stats,
            "sample_tables": [
                {
                    "fqn": ".".join(p for p in [t.catalog, t.schema, t.name] if p),
                    "description": t.description,
                    "row_count": t.row_count,
                    "size_bytes": t.size_bytes,
                    "columns": [
                        {"name": c.name, "type": c.data_type, "doc": c.description}
                        for c in t.columns[:8]
                    ],
                    "tags": t.tags,
                }
                for t in inv.tables[:30]
            ],
            "pipelines": [
                {"name": p.name, "type": p.type, "status": p.last_run_status}
                for p in inv.pipelines[:20]
            ],
        },
        default=str,
    )[:18000]

    user_msg = USER_TEMPLATE.format(
        inventory_json=inventory_json,
        readiness=score.readiness_score,
        pillars=json.dumps(score.pillars),
        findings=json.dumps([asdict(f) for f in score.findings])[:4000],
        recs=json.dumps([asdict(r) for r in score.recommendations])[:4000],
    )

    try:
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_msg}],
        )
        text = "".join(block.text for block in response.content if block.type == "text")
        # Strip any accidental code fences
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```", 2)[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip("` \n")
        parsed = json.loads(text)
        return parsed
    except Exception as exc:  # noqa: BLE001
        log.warning("ai_analyzer_error", error=str(exc))
        return {
            "narrative": _fallback_narrative(score),
            "extra_findings": [],
            "extra_recommendations": [],
            "rewritten_recommendations": [],
        }


def _fallback_narrative(score: ScoreResult) -> str:
    weakest = min(score.pillars.items(), key=lambda kv: kv[1])
    return (
        f"AI Readiness Score: {score.readiness_score}/100. The weakest pillar is "
        f"'{weakest[0]}' at {weakest[1]}/100. Address governance and metadata coverage "
        f"first to unblock RAG and semantic-layer work."
    )

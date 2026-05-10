from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.scan import ScanStatus
from app.schemas.common import ORMBase


class ScanCreate(BaseModel):
    connection_id: UUID


class ScanRead(ORMBase):
    id: UUID
    connection_id: UUID
    status: ScanStatus
    error: str | None
    progress: int
    summary: dict
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime


class Finding(BaseModel):
    id: str
    severity: str  # "low" | "medium" | "high" | "critical"
    title: str
    description: str
    evidence: list[str] = []


class Recommendation(BaseModel):
    id: str
    priority: str  # "low" | "medium" | "high"
    title: str
    description: str
    effort: str  # "low" | "medium" | "high"


class Pillar(BaseModel):
    id: str
    name: str
    score: int
    weight: float


class ReportRead(BaseModel):
    id: UUID
    scan_id: UUID
    readiness_score: int
    rag_readiness_score: int
    semantic_maturity_score: int
    pillars: list[Pillar]
    findings: list[Finding]
    recommendations: list[Recommendation]
    inventory: dict
    created_at: datetime

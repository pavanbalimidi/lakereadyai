from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    scan_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("scans.id", ondelete="CASCADE"), unique=True, index=True
    )

    # Aggregate scores (0-100)
    readiness_score: Mapped[int] = mapped_column(Integer, default=0)
    rag_readiness_score: Mapped[int] = mapped_column(Integer, default=0)
    semantic_maturity_score: Mapped[int] = mapped_column(Integer, default=0)

    # Sub-scores per pillar
    pillars: Mapped[dict] = mapped_column(JSON, default=dict)
    # [{"id":"...", "severity":"high", "title":"...", "description":"...", "evidence":[...]}]
    findings: Mapped[list] = mapped_column(JSON, default=list)
    # [{"id":"...", "priority":"high", "title":"...", "description":"...", "effort":"low"}]
    recommendations: Mapped[list] = mapped_column(JSON, default=list)

    # Inventory snapshot for dashboard
    inventory: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    scan = relationship("Scan", back_populates="report")

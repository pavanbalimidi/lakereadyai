import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.session import Base


class ConnectionType(str, enum.Enum):
    DATABRICKS = "databricks"
    SNOWFLAKE = "snowflake"
    MOCK = "mock"


class Connection(Base):
    __tablename__ = "connections"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    org_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[ConnectionType] = mapped_column(
        Enum(ConnectionType, name="connection_type"), nullable=False
    )
    # Credentials are stored encrypted at rest in production. For MVP we keep them
    # in JSON and rely on the secret_key env var as KEK. See services/secrets.py.
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_by: Mapped[UUID | None] = mapped_column(Uuid, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    scans = relationship("Scan", back_populates="connection", cascade="all, delete-orphan")

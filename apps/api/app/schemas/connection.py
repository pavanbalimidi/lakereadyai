from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.connection import ConnectionType
from app.schemas.common import ORMBase


class ConnectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: ConnectionType
    config: dict = Field(default_factory=dict)


class ConnectionUpdate(BaseModel):
    name: str | None = None
    config: dict | None = None


class ConnectionRead(ORMBase):
    id: UUID
    name: str
    type: ConnectionType
    config: dict
    created_at: datetime
    updated_at: datetime


class ConnectionTestResult(BaseModel):
    ok: bool
    message: str
    sample: dict | None = None

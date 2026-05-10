from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user
from app.models import Connection, User
from app.schemas.connection import (
    ConnectionCreate,
    ConnectionRead,
    ConnectionTestResult,
    ConnectionUpdate,
)
from app.services.connectors import get_connector

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=list[ConnectionRead])
def list_connections(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Connection]:
    return (
        db.query(Connection)
        .filter(Connection.org_id == (user.org_id or ""))
        .order_by(Connection.created_at.desc())
        .all()
    )


@router.post("", response_model=ConnectionRead, status_code=status.HTTP_201_CREATED)
def create_connection(
    body: ConnectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Connection:
    conn = Connection(
        org_id=user.org_id or "",
        name=body.name,
        type=body.type,
        config=body.config,
        created_by=user.id,
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return conn


@router.get("/{connection_id}", response_model=ConnectionRead)
def get_connection(
    connection_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Connection:
    conn = _get_owned(db, user, connection_id)
    return conn


@router.patch("/{connection_id}", response_model=ConnectionRead)
def update_connection(
    connection_id: UUID,
    body: ConnectionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Connection:
    conn = _get_owned(db, user, connection_id)
    if body.name is not None:
        conn.name = body.name
    if body.config is not None:
        conn.config = body.config
    db.commit()
    db.refresh(conn)
    return conn


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(
    connection_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    conn = _get_owned(db, user, connection_id)
    db.delete(conn)
    db.commit()


@router.post("/{connection_id}/test", response_model=ConnectionTestResult)
def test_connection(
    connection_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ConnectionTestResult:
    conn = _get_owned(db, user, connection_id)
    connector = get_connector(conn.type, conn.config or {})
    ok, message = connector.test_connection()
    return ConnectionTestResult(ok=ok, message=message)


def _get_owned(db: Session, user: User, connection_id: UUID) -> Connection:
    conn = db.get(Connection, connection_id)
    if not conn or conn.org_id != (user.org_id or ""):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    return conn

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, get_db
from app.deps import get_current_user
from app.models import Connection, Report, Scan, ScanStatus, User
from app.schemas.scan import ReportRead, ScanCreate, ScanRead
from app.services.scanner import run_scan

router = APIRouter(prefix="/scans", tags=["scans"])


def _run_scan_bg(scan_id: UUID) -> None:
    """Background task wrapper that opens its own DB session."""
    db = SessionLocal()
    try:
        run_scan(db, scan_id)
    finally:
        db.close()


@router.get("", response_model=list[ScanRead])
def list_scans(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Scan]:
    return (
        db.query(Scan)
        .filter(Scan.org_id == (user.org_id or ""))
        .order_by(Scan.created_at.desc())
        .limit(100)
        .all()
    )


@router.post("", response_model=ScanRead, status_code=status.HTTP_202_ACCEPTED)
def create_scan(
    body: ScanCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Scan:
    conn = db.get(Connection, body.connection_id)
    if not conn or conn.org_id != (user.org_id or ""):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection not found")
    scan = Scan(org_id=user.org_id or "", connection_id=conn.id, status=ScanStatus.PENDING)
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # In production this enqueues to Celery; locally we use FastAPI BackgroundTasks
    # so that an MVP demo doesn't require Redis to be running.
    try:
        from app.workers.tasks import run_scan_task

        run_scan_task.delay(str(scan.id))
    except Exception:  # noqa: BLE001 - Celery/Redis may be down in dev
        background.add_task(_run_scan_bg, scan.id)

    return scan


@router.get("/{scan_id}", response_model=ScanRead)
def get_scan(
    scan_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> Scan:
    scan = db.get(Scan, scan_id)
    if not scan or scan.org_id != (user.org_id or ""):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return scan


@router.get("/{scan_id}/report", response_model=ReportRead)
def get_report(
    scan_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> Report:
    scan = db.get(Scan, scan_id)
    if not scan or scan.org_id != (user.org_id or ""):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    report = db.query(Report).filter(Report.scan_id == scan.id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not ready yet"
        )
    return report

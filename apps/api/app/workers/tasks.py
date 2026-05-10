from uuid import UUID

from app.db.session import SessionLocal
from app.services.scanner import run_scan
from app.workers.celery_app import celery_app


@celery_app.task(name="aiready.run_scan", bind=True, max_retries=2, default_retry_delay=30)
def run_scan_task(self, scan_id: str) -> None:
    db = SessionLocal()
    try:
        run_scan(db, UUID(scan_id))
    finally:
        db.close()

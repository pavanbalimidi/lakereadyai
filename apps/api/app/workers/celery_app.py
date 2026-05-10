from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "aiready",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=60 * 30,
    task_soft_time_limit=60 * 25,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=True,
)

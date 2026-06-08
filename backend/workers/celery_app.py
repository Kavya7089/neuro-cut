from celery import Celery

celery_app = Celery(
    "neurocut_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Ensure fault-tolerant properties (if worker dies, keep task in queue for retry)
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

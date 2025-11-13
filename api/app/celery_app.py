from celery import Celery
import os


def _make_celery() -> Celery:
    broker_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    backend_url = os.getenv("REDIS_BACKEND_URL", broker_url)
    app = Celery(
        "recon",
        broker=broker_url,
        backend=backend_url,
        include=[],
    )
    app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )
    return app


celery_app = _make_celery()


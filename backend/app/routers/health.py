# Simple endpoint to check the server is alive.
from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}

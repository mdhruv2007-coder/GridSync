# Simple health check so we can confirm the API is running.
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok", "app": "GridSync API"}

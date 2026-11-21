<<<<<<< HEAD
﻿# Simple health check so we can confirm the API is running.
from fastapi import APIRouter

=======
# Simple endpoint to check the server is alive.
from fastapi import APIRouter

from app.core.config import settings

>>>>>>> feature/backend-services
router = APIRouter(tags=["health"])


@router.get("/health")
def health():
<<<<<<< HEAD
    return {"status": "ok", "app": "GridSync API"}
=======
    return {"status": "ok", "app": settings.APP_NAME}
>>>>>>> feature/backend-services

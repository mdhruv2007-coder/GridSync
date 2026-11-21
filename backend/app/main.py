# FastAPI application entry point: creates tables, enables CORS, registers routers.
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (importing registers all tables)
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import appliances, health, scenarios, schedule, tariff


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: create any missing tables in gridsync.db
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="GridSync: decision-support scheduler for Time-of-Day electricity tariffs. "
    "Tariffs are configurable samples; savings are modelled estimates.",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow the React dev server to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Every route lives under /api
app.include_router(health.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(appliances.router, prefix="/api")
app.include_router(tariff.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")

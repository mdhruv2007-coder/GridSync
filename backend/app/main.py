# GridSync API entry point: creates the app, tables, CORS and registers all routers.
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (importing registers the tables on Base)
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import appliances, health, scenarios, schedule, tariff


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables on startup if they do not exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(appliances.router, prefix="/api")
app.include_router(tariff.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")

# Database setup: engine, session factory, Base class and the get_db dependency.
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite with FastAPI
)


@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_conn, _record):
    # SQLite ignores foreign keys unless this is switched on
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """All models inherit from this class."""
    pass


def get_db():
    # one session per request, always closed afterwards
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database setup: engine (connection), SessionLocal (per-request session), Base (parent of all models).
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# check_same_thread=False is needed for SQLite because FastAPI uses several threads
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})


# SQLite ignores foreign keys by default; turn them on so deletes cascade properly
@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """All ORM models inherit from this class."""


def get_db():
    """FastAPI dependency: opens a session for one request and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
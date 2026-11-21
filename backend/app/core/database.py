<<<<<<< HEAD
﻿# Database setup: engine, session factory, Base class and the get_db dependency.
=======
# Database setup: engine (connection), SessionLocal (per-request session), Base (parent of all models).
>>>>>>> feature/backend-services
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

<<<<<<< HEAD
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite with FastAPI
)


@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_conn, _record):
    # SQLite ignores foreign keys unless this is switched on
    dbapi_conn.execute("PRAGMA foreign_keys=ON")
=======
# check_same_thread=False is needed for SQLite because FastAPI uses several threads
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})


# SQLite ignores foreign keys by default; turn them on so deletes cascade properly
@event.listens_for(engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
>>>>>>> feature/backend-services


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
<<<<<<< HEAD
    """All models inherit from this class."""
    pass


def get_db():
    # one session per request, always closed afterwards
=======
    """All ORM models inherit from this class."""


def get_db():
    """FastAPI dependency: opens a session for one request and always closes it."""
>>>>>>> feature/backend-services
    db = SessionLocal()
    try:
        yield db
    finally:
<<<<<<< HEAD
        db.close()
=======
        db.close()
>>>>>>> feature/backend-services

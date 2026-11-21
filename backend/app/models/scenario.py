# A scenario = a named bundle of appliances + one tariff.
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Deleting a scenario deletes its appliances and tariff too
    appliances = relationship(
        "Appliance", back_populates="scenario", cascade="all, delete-orphan"
    )
    tariff = relationship(
        "Tariff", back_populates="scenario", uselist=False, cascade="all, delete-orphan"
    )

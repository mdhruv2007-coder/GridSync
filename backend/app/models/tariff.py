# A tariff belongs to one scenario and has several time slots covering the 24 hours.
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Tariff(Base):
    __tablename__ = "tariffs"

    id: Mapped[int] = mapped_column(primary_key=True)
    # unique=True -> one tariff per scenario
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey("scenarios.id", ondelete="CASCADE"), unique=True
    )
    base_rate: Mapped[float] = mapped_column(Float, nullable=False)  # Rs/kWh
    max_load_kw: Mapped[float] = mapped_column(Float, nullable=False)

    scenario = relationship("Scenario", back_populates="tariff")
    slots = relationship(
        "TariffSlot",
        back_populates="tariff",
        cascade="all, delete-orphan",
        order_by="TariffSlot.start_hour",
    )


class TariffSlot(Base):
    __tablename__ = "tariff_slots"

    id: Mapped[int] = mapped_column(primary_key=True)
    tariff_id: Mapped[int] = mapped_column(ForeignKey("tariffs.id", ondelete="CASCADE"))
    start_hour: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-23
    end_hour: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-24 (exclusive)
    label: Mapped[str] = mapped_column(String(10), nullable=False)  # solar|normal|peak|offpeak
    adjustment_pct: Mapped[float] = mapped_column(Float, default=0.0)

    tariff = relationship("Tariff", back_populates="slots")
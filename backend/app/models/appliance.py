# One row per appliance. Fixed appliances have no earliest_start/deadline (they are never moved).
from typing import Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Appliance(Base):
    __tablename__ = "appliances"

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    power_kw: Mapped[float] = mapped_column(Float, nullable=False)
    duration_h: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(10), nullable=False)  # "flexible" | "fixed"
    interruptible: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_start: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-23, defines baseline
    earliest_start: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # flexible only
    deadline: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # flexible only, 0-24

    scenario = relationship("Scenario", back_populates="appliances")

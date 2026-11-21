# Tariff schemas. The most important rule: slots must cover all 24 hours exactly once.
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TariffSlotSchema(BaseModel):
    start_hour: int = Field(ge=0, le=23)
    end_hour: int = Field(ge=1, le=24)  # exclusive, so 22-24 means hours 22 and 23
    label: Literal["solar", "normal", "peak", "offpeak"]
    adjustment_pct: float = Field(default=0.0, ge=-100, le=500)

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_hour <= self.start_hour:
            raise ValueError("end_hour must be greater than start_hour")
        return self


def check_slots_cover_24h(slots) -> None:
    """Raise ValueError unless every hour 0-23 is covered by exactly one slot."""
    count = [0] * 24
    for s in slots:
        for h in range(s.start_hour, s.end_hour):
            count[h] += 1
    missing = [h for h in range(24) if count[h] == 0]
    overlap = [h for h in range(24) if count[h] > 1]
    if missing:
        raise ValueError(f"Tariff slots must cover all 24 hours; missing hours: {missing}")
    if overlap:
        raise ValueError(f"Tariff slots must not overlap; overlapping hours: {overlap}")


class TariffBase(BaseModel):
    base_rate: float = Field(gt=0)  # Rs per kWh
    max_load_kw: float = Field(gt=0)
    slots: list[TariffSlotSchema]

    @model_validator(mode="after")
    def validate_coverage(self):
        check_slots_cover_24h(self.slots)
        return self


class TariffUpdate(TariffBase):
    # Which scenario's tariff to replace
    scenario_id: int


class TariffRead(TariffBase):
    id: Optional[int] = None
    scenario_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
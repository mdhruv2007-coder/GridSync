# Scenario schemas: save a named set of appliances + tariff, list them, load one.
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.appliance import ApplianceBase, ApplianceRead
from app.schemas.tariff import TariffBase, TariffRead


class ScenarioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    appliances: list[ApplianceBase] = Field(default_factory=list)
    tariff: TariffBase


class ScenarioSummary(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScenarioDetail(ScenarioSummary):
    appliances: list[ApplianceRead]
    tariff: Optional[TariffRead] = None
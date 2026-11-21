# Request/response shapes for /api/schedule/optimize and /api/schedule/evaluate.
# These endpoints are STATELESS: the frontend sends the appliances and tariff in the body.
from pydantic import BaseModel, Field

from app.schemas.appliance import ApplianceBase
from app.schemas.tariff import TariffBase


class ApplianceIn(ApplianceBase):
    # Same as an appliance, plus an id so results can refer to it
    id: int


class ScheduleItem(BaseModel):
    appliance_id: int
    hours: list[int]  # the clock hours (0-23) in which the appliance runs


class ScheduleResult(BaseModel):
    items: list[ScheduleItem]
    hourly_load: list[float]  # kW per hour, length 24
    hourly_cost: list[float]  # Rs per hour, length 24
    total_cost: float  # Rs per day
    peak_load: float  # kW


class Savings(BaseModel):
    daily: float
    monthly: float  # daily x 30
    yearly: float  # daily x 365
    percent: float


class OptimiseRequest(BaseModel):
    appliances: list[ApplianceIn]
    tariff: TariffBase


class OptimiseResponse(BaseModel):
    baseline: ScheduleResult
    optimised: ScheduleResult
    savings: Savings
    warnings: list[str] = Field(default_factory=list)


class EvaluateRequest(BaseModel):
    appliances: list[ApplianceIn]
    tariff: TariffBase
    items: list[ScheduleItem]  # the manual schedule (for example after a drag)
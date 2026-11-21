# Pydantic schemas = what the API accepts and returns. They also validate the input.
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ApplianceBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    power_kw: float = Field(gt=0)  # must be positive
    duration_h: int = Field(ge=1, le=24)
    category: Literal["flexible", "fixed"]
    interruptible: bool = False
    preferred_start: int = Field(ge=0, le=23)
    earliest_start: Optional[int] = Field(default=None, ge=0, le=23)
    deadline: Optional[int] = Field(default=None, ge=0, le=24)

    @model_validator(mode="after")
    def flexible_needs_window(self):
        # Flexible appliances must say when they may start and when they must be finished
        if self.category == "flexible" and (self.earliest_start is None or self.deadline is None):
            raise ValueError("Flexible appliances need earliest_start and deadline")
        return self


class ApplianceCreate(ApplianceBase):
    # Which scenario the appliance belongs to
    scenario_id: int


class ApplianceUpdate(ApplianceBase):
    pass


class ApplianceRead(ApplianceBase):
    id: int
    scenario_id: int

    # Lets Pydantic read values straight from SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)
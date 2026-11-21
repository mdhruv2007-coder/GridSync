# Stateless scheduling endpoints: everything comes in the request body, nothing is saved.
from fastapi import APIRouter, HTTPException

from app.schemas.schedule import (
    EvaluateRequest,
    OptimiseRequest,
    OptimiseResponse,
    ScheduleResult,
)
from app.services import scheduler

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("/optimize", response_model=OptimiseResponse)
def optimize(request: OptimiseRequest):
    # the service works with plain dicts
    appliances = [a.model_dump() for a in request.appliances]
    tariff = request.tariff.model_dump()
    try:
        return scheduler.optimise(appliances, tariff)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/evaluate", response_model=ScheduleResult)
def evaluate(request: EvaluateRequest):
    # the schema does not range-check hours, so we do it here
    for item in request.items:
        for hour in item.hours:
            if hour < 0 or hour > 23:
                raise HTTPException(
                    status_code=422,
                    detail=f"Appliance {item.appliance_id}: hour {hour} is outside 0-23",
                )

    appliances = [a.model_dump() for a in request.appliances]
    tariff = request.tariff.model_dump()
    items = [i.model_dump() for i in request.items]
    try:
        return scheduler.evaluate_schedule(appliances, items, tariff)
    except ValueError as exc:
        # for example: unknown appliance id
        raise HTTPException(status_code=422, detail=str(exc))

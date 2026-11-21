# Tariff endpoints: read/replace the tariff of a scenario, and list sample presets.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Scenario, Tariff, TariffSlot
from app.schemas.tariff import TariffRead, TariffUpdate
from app.services import presets

router = APIRouter(prefix="/tariff", tags=["tariff"])


@router.get("/presets")
def list_presets():
    # Sample tariffs (editable by the user, NOT real utility rates)
    return presets.get_presets()


@router.get("", response_model=TariffRead)
def get_tariff(scenario_id: int, db: Session = Depends(get_db)):
    if db.get(Scenario, scenario_id) is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    tariff = db.query(Tariff).filter(Tariff.scenario_id == scenario_id).first()
    if tariff is None:
        raise HTTPException(status_code=404, detail="Tariff not found for this scenario")
    return tariff


@router.put("", response_model=TariffRead)
def put_tariff(payload: TariffUpdate, db: Session = Depends(get_db)):
    # Pydantic has already checked that the slots cover 24 hours (else 422)
    if db.get(Scenario, payload.scenario_id) is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    new_slots = [TariffSlot(**s.model_dump()) for s in payload.slots]
    tariff = db.query(Tariff).filter(Tariff.scenario_id == payload.scenario_id).first()

    if tariff is None:
        # first time: create the tariff
        tariff = Tariff(
            scenario_id=payload.scenario_id,
            base_rate=payload.base_rate,
            max_load_kw=payload.max_load_kw,
            slots=new_slots,
        )
        db.add(tariff)
    else:
        # update numbers and REPLACE all slots (old ones are deleted by delete-orphan)
        tariff.base_rate = payload.base_rate
        tariff.max_load_kw = payload.max_load_kw
        tariff.slots = new_slots

    db.commit()
    db.refresh(tariff)
    return tariff

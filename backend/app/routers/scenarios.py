# Save, list, load and delete scenarios (appliances + tariff stored together).
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Appliance, Scenario, Tariff, TariffSlot
from app.schemas.scenario import ScenarioCreate, ScenarioDetail, ScenarioSummary
from app.services import presets

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

SAMPLE_NAME = "Sample Household"


def create_scenario_in_db(db: Session, data: ScenarioCreate) -> Scenario:
    """Shared helper: used by POST /scenarios and by the seed endpoint."""
    scenario = Scenario(name=data.name)
    scenario.appliances = [Appliance(**a.model_dump()) for a in data.appliances]
    scenario.tariff = Tariff(
        base_rate=data.tariff.base_rate,
        max_load_kw=data.tariff.max_load_kw,
        slots=[TariffSlot(**s.model_dump()) for s in data.tariff.slots],
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.get("", response_model=list[ScenarioSummary])
def list_scenarios(db: Session = Depends(get_db)):
    # newest first
    return db.query(Scenario).order_by(Scenario.created_at.desc(), Scenario.id.desc()).all()


@router.post("", response_model=ScenarioDetail, status_code=201)
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_db)):
    return create_scenario_in_db(db, payload)


@router.post("/seed", response_model=ScenarioDetail)
def seed_sample(response: Response, db: Session = Depends(get_db)):
    # idempotent: if "Sample Household" exists, return it and create nothing
    existing = db.query(Scenario).filter(Scenario.name == SAMPLE_NAME).first()
    if existing is not None:
        return existing  # status 200
    data = ScenarioCreate(**presets.load_sample_scenario())
    scenario = create_scenario_in_db(db, data)
    response.status_code = 201
    return scenario


@router.get("/{scenario_id}", response_model=ScenarioDetail)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.delete("/{scenario_id}", status_code=204)
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    scenario = db.get(Scenario, scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(scenario)  # cascades to appliances, tariff and slots
    db.commit()
    return Response(status_code=204)

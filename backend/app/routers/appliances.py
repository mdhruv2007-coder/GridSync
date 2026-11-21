# CRUD endpoints for appliances. Every appliance belongs to one saved scenario.
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Appliance, Scenario
from app.schemas.appliance import ApplianceCreate, ApplianceRead, ApplianceUpdate

router = APIRouter(prefix="/appliances", tags=["appliances"])


def get_appliance_or_404(db: Session, appliance_id: int) -> Appliance:
    appliance = db.get(Appliance, appliance_id)
    if appliance is None:
        raise HTTPException(status_code=404, detail="Appliance not found")
    return appliance


@router.get("", response_model=list[ApplianceRead])
def list_appliances(scenario_id: int, db: Session = Depends(get_db)):
    # 404 if the scenario itself does not exist
    if db.get(Scenario, scenario_id) is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return (
        db.query(Appliance)
        .filter(Appliance.scenario_id == scenario_id)
        .order_by(Appliance.id)
        .all()
    )


@router.post("", response_model=ApplianceRead, status_code=201)
def create_appliance(payload: ApplianceCreate, db: Session = Depends(get_db)):
    if db.get(Scenario, payload.scenario_id) is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    appliance = Appliance(**payload.model_dump())
    db.add(appliance)
    db.commit()
    db.refresh(appliance)
    return appliance


@router.put("/{appliance_id}", response_model=ApplianceRead)
def update_appliance(appliance_id: int, payload: ApplianceUpdate, db: Session = Depends(get_db)):
    appliance = get_appliance_or_404(db, appliance_id)
    # copy every field from the request onto the database row
    for key, value in payload.model_dump().items():
        setattr(appliance, key, value)
    db.commit()
    db.refresh(appliance)
    return appliance


@router.delete("/{appliance_id}", status_code=204)
def delete_appliance(appliance_id: int, db: Session = Depends(get_db)):
    appliance = get_appliance_or_404(db, appliance_id)
    db.delete(appliance)
    db.commit()
    return Response(status_code=204)

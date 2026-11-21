# API tests. They use a temporary in-memory database, so gridsync.db is never touched.
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registers the tables)
from app.core.database import Base, get_db
from app.main import app

# the sample tariff (base 7.0, max load 5 kW)
TARIFF = {
    "base_rate": 7.0,
    "max_load_kw": 5.0,
    "slots": [
        {"start_hour": 0, "end_hour": 6, "label": "offpeak", "adjustment_pct": 0},
        {"start_hour": 6, "end_hour": 9, "label": "normal", "adjustment_pct": 0},
        {"start_hour": 9, "end_hour": 17, "label": "solar", "adjustment_pct": -15},
        {"start_hour": 17, "end_hour": 22, "label": "peak", "adjustment_pct": 20},
        {"start_hour": 22, "end_hour": 24, "label": "normal", "adjustment_pct": 0},
    ],
}


@pytest.fixture()
def client():
    # fresh in-memory database for every test
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _fk_on(dbapi_conn, _record):
        dbapi_conn.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    # no "with" here, so the startup lifespan (real gridsync.db) is not run
    yield TestClient(app)
    app.dependency_overrides.clear()
    engine.dispose()


def make_scenario(client, name="Test"):
    resp = client.post("/api/scenarios", json={"name": name, "appliances": [], "tariff": TARIFF})
    assert resp.status_code == 201
    return resp.json()


def appliance_body(scenario_id, **changes):
    body = {
        "scenario_id": scenario_id,
        "name": "Washing machine",
        "power_kw": 0.5,
        "duration_h": 2,
        "category": "flexible",
        "interruptible": False,
        "preferred_start": 19,
        "earliest_start": 8,
        "deadline": 22,
    }
    body.update(changes)
    return body


# ---------- health and presets ----------

def test_health_ok(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_presets_returns_three(client):
    resp = client.get("/api/tariff/presets")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


# ---------- schedule ----------

def test_optimize_sample_household_saves_money(client):
    seeded = client.post("/api/scenarios/seed").json()
    body = {"appliances": seeded["appliances"], "tariff": seeded["tariff"]}
    resp = client.post("/api/schedule/optimize", json=body)
    assert resp.status_code == 200
    data = resp.json()
    assert data["savings"]["daily"] > 0
    assert data["optimised"]["total_cost"] <= data["baseline"]["total_cost"]


def test_optimize_bad_tariff_returns_422(client):
    bad = dict(TARIFF)
    bad["slots"] = TARIFF["slots"][:-1]  # hours 22-24 are missing
    resp = client.post("/api/schedule/optimize", json={"appliances": [], "tariff": bad})
    assert resp.status_code == 422


def evaluate_body(hours, appliance_id=1):
    fridge_like = {
        "id": 1,
        "name": "Heater",
        "power_kw": 1.0,
        "duration_h": 1,
        "category": "fixed",
        "interruptible": False,
        "preferred_start": 10,
    }
    return {
        "appliances": [fridge_like],
        "tariff": TARIFF,
        "items": [{"appliance_id": appliance_id, "hours": hours}],
    }


def test_evaluate_correct_total_cost(client):
    # 1 kW at hour 10 (solar): 1 * 7.0 * 0.85 = 5.95
    resp = client.post("/api/schedule/evaluate", json=evaluate_body([10]))
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_cost"] == pytest.approx(5.95)
    assert data["peak_load"] == pytest.approx(1.0)


def test_evaluate_hour_25_returns_422(client):
    resp = client.post("/api/schedule/evaluate", json=evaluate_body([25]))
    assert resp.status_code == 422


def test_evaluate_unknown_appliance_returns_422(client):
    resp = client.post("/api/schedule/evaluate", json=evaluate_body([10], appliance_id=99))
    assert resp.status_code == 422


# ---------- scenarios ----------

def test_seed_creates_sample_household(client):
    resp = client.post("/api/scenarios/seed")
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Sample Household"
    assert len(data["appliances"]) == 6
    assert data["tariff"]["base_rate"] == 7.0
    assert len(data["tariff"]["slots"]) == 5


def test_seed_twice_is_idempotent(client):
    first = client.post("/api/scenarios/seed")
    second = client.post("/api/scenarios/seed")
    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert len(client.get("/api/scenarios").json()) == 1


def test_get_unknown_scenario_returns_404(client):
    assert client.get("/api/scenarios/999").status_code == 404


def test_delete_scenario_cascades(client):
    seeded = client.post("/api/scenarios/seed").json()
    appliance_id = seeded["appliances"][0]["id"]
    resp = client.delete(f"/api/scenarios/{seeded['id']}")
    assert resp.status_code == 204
    assert client.get(f"/api/scenarios/{seeded['id']}").status_code == 404
    # the appliance rows are gone too: updating one now gives 404
    body = appliance_body(seeded["id"])
    body.pop("scenario_id")
    assert client.put(f"/api/appliances/{appliance_id}", json=body).status_code == 404


# ---------- appliances ----------

def test_appliance_round_trip(client):
    scenario = make_scenario(client)
    sid = scenario["id"]

    # create
    created = client.post("/api/appliances", json=appliance_body(sid))
    assert created.status_code == 201
    aid = created.json()["id"]

    # list
    listed = client.get(f"/api/appliances?scenario_id={sid}")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    # update
    update = appliance_body(sid, name="Washer v2", power_kw=0.8)
    update.pop("scenario_id")
    updated = client.put(f"/api/appliances/{aid}", json=update)
    assert updated.status_code == 200
    assert updated.json()["name"] == "Washer v2"
    assert updated.json()["power_kw"] == 0.8

    # delete
    assert client.delete(f"/api/appliances/{aid}").status_code == 204
    assert client.get(f"/api/appliances?scenario_id={sid}").json() == []


def test_appliance_unknown_scenario_returns_404(client):
    resp = client.post("/api/appliances", json=appliance_body(999))
    assert resp.status_code == 404


def test_flexible_without_earliest_start_returns_422(client):
    sid = make_scenario(client)["id"]
    body = appliance_body(sid)
    del body["earliest_start"]
    assert client.post("/api/appliances", json=body).status_code == 422


def test_unknown_appliance_and_scenario_return_404(client):
    assert client.get("/api/appliances?scenario_id=999").status_code == 404
    update = appliance_body(1)
    update.pop("scenario_id")
    assert client.put("/api/appliances/999", json=update).status_code == 404
    assert client.delete("/api/appliances/999").status_code == 404


# ---------- tariff ----------

def test_tariff_get_put_round_trip(client):
    sid = make_scenario(client)["id"]

    got = client.get(f"/api/tariff?scenario_id={sid}")
    assert got.status_code == 200
    assert len(got.json()["slots"]) == 5

    new_tariff = {
        "scenario_id": sid,
        "base_rate": 8.5,
        "max_load_kw": 7.0,
        "slots": [
            {"start_hour": 0, "end_hour": 12, "label": "offpeak", "adjustment_pct": -10},
            {"start_hour": 12, "end_hour": 24, "label": "peak", "adjustment_pct": 20},
        ],
    }
    put = client.put("/api/tariff", json=new_tariff)
    assert put.status_code == 200

    again = client.get(f"/api/tariff?scenario_id={sid}").json()
    assert again["base_rate"] == 8.5
    assert again["max_load_kw"] == 7.0
    assert len(again["slots"]) == 2  # old slots were replaced


def test_tariff_put_with_gap_returns_422(client):
    sid = make_scenario(client)["id"]
    bad = {
        "scenario_id": sid,
        "base_rate": 7.0,
        "max_load_kw": 5.0,
        "slots": [{"start_hour": 0, "end_hour": 12, "label": "normal", "adjustment_pct": 0}],
    }
    assert client.put("/api/tariff", json=bad).status_code == 422


def test_tariff_unknown_scenario_returns_404(client):
    assert client.get("/api/tariff?scenario_id=999").status_code == 404
    body = dict(TARIFF)
    body["scenario_id"] = 999
    assert client.put("/api/tariff", json=body).status_code == 404

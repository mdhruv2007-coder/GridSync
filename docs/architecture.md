# GridSync architecture

GridSync is a decision-support tool. It does not control appliances or read meters.
Tariffs are configurable samples and savings are modelled estimates.

## 1. Data flow

```
Browser (React, port 5173)
   |  axios calls to /api/...
   v
Vite dev proxy  --->  FastAPI (Uvicorn, port 8000)  --->  SQLite (gridsync.db)
```

1. The user edits appliances and the tariff. These edits are LOCAL state in `ScenarioContext` until the user saves a scenario.
2. On Optimise, the frontend sends the appliances and tariff to `POST /api/schedule/optimize`. The backend returns the baseline schedule, the optimised schedule, the savings and a list of warnings. Nothing is stored.
3. When the user drags a block, the frontend recomputes the cost locally (same maths as the backend) and may also call `POST /api/schedule/evaluate`. The result is checked against the appliance window and the maximum load.
4. Saving a scenario sends the name, the appliances and the tariff to `POST /api/scenarios`. Loading a scenario fetches it with `GET /api/scenarios/{id}` and replaces the local appliances and tariff.
5. Any change to an appliance or the tariff clears the old plan, so the Dashboard asks the user to Optimise again.

## 2. The circular 24-slot day

- Slot h is clock hour h, for h from 0 to 23. Durations are whole hours.
- The day is circular. A block that starts at 22:00 and lasts 4 hours uses hours 22, 23, 0 and 1.
- A window may cross midnight, for example earliest start 22 and deadline 7. A deadline of 24 is the same as 0.
- Tariff slots use an exclusive end hour: 22 to 24 means hours 22 and 23. Slots must cover all 24 hours exactly once.
- Hourly rate = `base_rate * (1 + adjustment_pct / 100)`.
- Cost of an appliance for one day = sum over its running hours of `power_kw * hourly rate`.

## 3. The scheduling algorithm (plain words)

- Fixed appliances run from `preferred_start` for `duration_h` hours (wrapping past midnight) and are never moved.
- The baseline is every appliance at its usual `preferred_start`.
- A flexible appliance may only run inside its window, from `earliest_start` until it is finished by `deadline`.
- The optimiser looks for the cheapest feasible hours for each flexible appliance inside its window, while keeping the total load in every hour at or below `max_load_kw`.
- A non-interruptible appliance runs as one continuous block. An interruptible appliance (such as an EV charger) may be split into separate hours.
- If something cannot be placed or the load limit cannot be met, the response includes messages in `warnings`.
- Savings are computed from baseline cost versus optimised cost: daily, monthly (daily x 30), yearly (daily x 365) and percent.

## 4. Backend structure

- `routers/` hold the endpoints and only do request handling.
- `schemas/` validate input (Pydantic). Invalid input returns 422.
- `services/cost.py` computes hourly load, hourly cost, total cost and peak load.
- `services/scheduler.py` holds the optimisation logic.
- `services/presets.py` holds the sample tariffs and loads the Sample Household.
- `models/` are the SQLAlchemy tables: Scenario owns its Appliances and one Tariff, and a Tariff owns its TariffSlots. Deleting a scenario deletes everything under it.

## 5. Frontend structure

- `main.jsx` and `App.jsx`: router, `ToastProvider`, `ScenarioProvider`, and the routes `/`, `/appliances`, `/tariff`, `/scenarios`, `/about`.
- `api/`: one file per backend area (appliances, tariff, schedule, scenarios) on a shared axios client. `getErrorMessage` turns errors into readable text, including "Cannot reach the server" when the backend is down.
- `context/ScenarioContext.jsx`: the single source of truth (appliances, tariff, scenario id and name, plan, baseline, optimised, savings, warnings).
- `hooks/useOptimise.js`: runs the optimise call and stores the plan.
- `utils/`: `time.js` (circular hour helpers), `cost.js` (local cost maths), `format.js` (rupee formatting and tariff colours), `exportCsv.js` (CSV export).
- `components/`: `common` (Button, Card, Modal, Toast), `layout` (Navbar, Footer, Layout), `tariff` (SlotBar), `summary` (CostMeter, SavingsCard), `charts` (LoadCurve), `timeline` (Timeline24h, ApplianceBlock), `scenarios` (ScenarioList).
- `pages/`: Dashboard, Appliances, Tariff, Scenarios, About.
- Tariff colours are consistent everywhere: solar green, normal grey/blue, peak orange, offpeak indigo. The slot name is always shown as text too.

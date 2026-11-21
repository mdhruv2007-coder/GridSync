# GridSync

GridSync is a software-only appliance scheduler for Time-of-Day (ToD) electricity tariffs.
You enter your appliances (power, duration, usual start time, deadline) and your tariff slots
(solar, normal, peak, offpeak, with percentage adjustments). The backend runs a
constraint-based scheduling algorithm that moves flexible appliances into the cheapest
feasible hours without breaking deadlines or a load limit. The frontend shows a 24-hour
timeline, a before-versus-after load curve and a live cost meter. You can drag an appliance
to another hour and see the cost update instantly.

## Important: please read

- GridSync is a DECISION-SUPPORT tool. It does not control appliances and does not read real meters.
- Tariff values are CONFIGURABLE SAMPLES. Edit them to match your own bill. They are NOT the actual rates of BESCOM or any other company.
- All savings are MODELLED ESTIMATES calculated from declared appliance ratings and hours.

## Features

- Appliance list with flexible (movable) and fixed (never moved) appliances
- Editable ToD tariff with presets (Sample ToD, Hostel / PG, College Canteen)
- One-click Optimise Schedule with warnings from the optimiser
- 24-hour timeline with drag and drop and a "Move to hour" fallback
- Load curve (before versus after) with the maximum load line
- Cost meters with daily, monthly and yearly modelled estimates
- Export the optimised schedule as CSV
- Save, load and delete scenarios; one-click Sample Household

## Tech stack

- Frontend: React 18, Vite, Tailwind CSS 3, react-router-dom, axios, recharts, @dnd-kit/core (JavaScript)
- Backend: Python 3.13, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic v2, SQLite
- Testing: pytest, httpx
- Tooling: Git and GitHub

## How to run (Windows PowerShell)

Open two terminals. Replace the path with your own project folder.

Terminal 1, backend (must be run from the backend folder):

```powershell
Set-Location "D:\IMP PDF\Reva university\Assignments\3rd sem\IDT\GridSync\backend"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Terminal 2, frontend:

```powershell
Set-Location "D:\IMP PDF\Reva university\Assignments\3rd sem\IDT\GridSync\frontend"
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to http://localhost:8000.
The interactive API docs are at http://localhost:8000/docs.

If the venv does not exist yet, create it first from the backend folder with
`python -m venv venv`.

## How to run the tests

```powershell
Set-Location "D:\IMP PDF\Reva university\Assignments\3rd sem\IDT\GridSync\backend"
.\venv\Scripts\Activate.ps1
python -m pytest -v
```

All tests should pass (34 at the time of writing).

## Try it in under 5 minutes

1. Open the app and click Load Sample Household.
2. Edit one tariff slot on the Tariff page and see the colours update.
3. On the Dashboard click Optimise Schedule.
4. Drag one appliance to another hour. An invalid drop is rejected with a message.
5. Click Export CSV. Save the scenario on the Scenarios page and load it again.

## Screenshots (placeholders)

Save the images in `docs\assets` and link them here.

- `docs/assets/dashboard.png`: Dashboard after Optimise
- `docs/assets/timeline.png`: 24-hour timeline with drag and drop
- `docs/assets/load-curve.png`: before versus after load curve
- `docs/assets/appliances.png`: Appliances page
- `docs/assets/tariff.png`: Tariff page with slot bar
- `docs/assets/scenarios.png`: Scenarios page
- `docs/assets/csv-export.png`: exported CSV opened in Excel

## Folder structure

```
GridSync/
  backend/
    app/
      core/        settings and database connection
      data/        sample_scenario.json
      models/      SQLAlchemy tables
      routers/     API endpoints (appliances, tariff, schedule, scenarios, health)
      schemas/     Pydantic request and response shapes
      services/    cost maths, scheduler, tariff presets
      main.py      FastAPI app
    tests/         test_api.py, test_cost.py, test_scheduler.py
    requirements.txt
  frontend/
    src/
      api/         axios calls
      components/  common, layout, tariff, summary, charts, timeline, scenarios
      context/     ScenarioContext (shared state)
      hooks/       useOptimise
      pages/       Dashboard, Appliances, Tariff, Scenarios, About
      utils/       time, cost, format, exportCsv
  docs/
    architecture.md
    api.md
    assets/        screenshots
```

## Team

- M Dhruv: Team leader, backend and scheduling algorithm
- Mohammed Rayhanullah B: Frontend developer
- K Vinay Dixith: API integration, test data and documentation

## Git workflow

`main` is stable and demo-ready, `dev` is the integration branch, and each task is a
`feature/<task>` branch merged into `dev` by Pull Request. Commit prefixes: `feat:`,
`fix:`, `docs:`, `test:`.

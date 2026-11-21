# GridSync backend

FastAPI + SQLAlchemy + SQLite service. It stores appliances, tariffs and scenarios, and runs
the scheduling algorithm. The optimise and evaluate endpoints are STATELESS: the frontend
sends the appliances and tariff in the request body, so they work before anything is saved.

Tariff values are configurable samples, not real utility rates. All savings are modelled estimates.

## Run (from the backend folder)

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Always run from the `backend` folder, otherwise you get `ModuleNotFoundError: No module named 'app'`.
Always use `python -m ...` for uvicorn, pip and pytest.

- Health check: http://localhost:8000/api/health
- Interactive docs: http://localhost:8000/docs
- Database: SQLite file `gridsync.db`, created automatically in the backend folder.
- Settings: copy `.env.example` to `.env` if you want to change defaults.

## Tests

```powershell
python -m pytest -v
```

- `tests\test_cost.py`: hourly rates and cost maths
- `tests\test_scheduler.py`: the scheduling algorithm
- `tests\test_api.py`: the HTTP endpoints

## Structure

```
app/
  main.py        creates the app and mounts all routers under /api
  core/          config.py (settings), database.py (engine and session)
  models/        appliance.py, tariff.py, scenario.py (database tables)
  schemas/       appliance.py, tariff.py, schedule.py, scenario.py (validation)
  routers/       appliances, tariff, schedule, scenarios, health
  services/      cost.py, scheduler.py, presets.py
  data/          sample_scenario.json (the Sample Household)
```

## Validation rules (enforced by the schemas)

- Appliance: `power_kw > 0`, `duration_h` 1 to 24, `preferred_start` 0 to 23. A flexible appliance must have `earliest_start` and `deadline`.
- Tariff: `base_rate > 0`, `max_load_kw > 0`. Slots must cover all 24 hours exactly once, with no gaps and no overlaps. `adjustment_pct` is -100 to 500.
- Invalid input returns HTTP 422.

See `..\docs\api.md` for every endpoint and `..\docs\architecture.md` for the design.

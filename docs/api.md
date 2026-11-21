# GridSync API

Base URL (local): `http://localhost:8000/api`. Interactive docs: `http://localhost:8000/docs`.
Tariff values are configurable samples, and all savings are modelled estimates.
Invalid input returns HTTP 422. A missing scenario returns HTTP 404 with `{"detail": "Scenario not found"}`.

## Data shapes

Appliance:

```json
{
  "name": "Washing machine",
  "power_kw": 0.5,
  "duration_h": 2,
  "category": "flexible",
  "interruptible": false,
  "preferred_start": 19,
  "earliest_start": 8,
  "deadline": 22
}
```

- `category` is `flexible` or `fixed`. Flexible appliances need `earliest_start` (0-23) and `deadline` (0-24). Fixed appliances use `null` for both.
- A stored appliance also has `id` and `scenario_id`.

Tariff:

```json
{
  "base_rate": 7.0,
  "max_load_kw": 5.0,
  "slots": [
    { "start_hour": 0, "end_hour": 6, "label": "offpeak", "adjustment_pct": 0 },
    { "start_hour": 6, "end_hour": 9, "label": "normal", "adjustment_pct": 0 },
    { "start_hour": 9, "end_hour": 17, "label": "solar", "adjustment_pct": -15 },
    { "start_hour": 17, "end_hour": 22, "label": "peak", "adjustment_pct": 20 },
    { "start_hour": 22, "end_hour": 24, "label": "normal", "adjustment_pct": 0 }
  ]
}
```

- `label` is `solar`, `normal`, `peak` or `offpeak`. `end_hour` is exclusive. Slots must cover all 24 hours exactly once (otherwise 422).

## Health

`GET /api/health`

```json
{ "status": "ok", "app": "<app name from settings>" }
```

## Appliances

- `GET /api/appliances?scenario_id=1` lists the appliances of a scenario.
- `POST /api/appliances` creates one. Body: an appliance plus `"scenario_id": 1`.
- `PUT /api/appliances/{id}` replaces one. Body: an appliance.
- `DELETE /api/appliances/{id}` deletes one.

Stored appliance returned by the API:

```json
{
  "id": 4,
  "scenario_id": 1,
  "name": "Washing machine",
  "power_kw": 0.5,
  "duration_h": 2,
  "category": "flexible",
  "interruptible": false,
  "preferred_start": 19,
  "earliest_start": 8,
  "deadline": 22
}
```

## Tariff

- `GET /api/tariff?scenario_id=1` returns the tariff of a scenario (404 if the scenario or its tariff is missing).
- `PUT /api/tariff` replaces the tariff and all its slots. Body: a tariff plus `"scenario_id": 1`.
- `GET /api/tariff/presets` returns the sample tariff presets (Sample ToD, Hostel / PG, College Canteen). They are editable samples, not real utility rates.

## Schedule (stateless)

Appliances in these requests also carry an `id` so results can refer to them.

`POST /api/schedule/optimize`

Request:

```json
{
  "appliances": [
    {
      "id": 1,
      "name": "Washing machine",
      "power_kw": 0.5,
      "duration_h": 2,
      "category": "flexible",
      "interruptible": false,
      "preferred_start": 19,
      "earliest_start": 8,
      "deadline": 22
    }
  ],
  "tariff": {
    "base_rate": 7.0,
    "max_load_kw": 5.0,
    "slots": [
      { "start_hour": 0, "end_hour": 6, "label": "offpeak", "adjustment_pct": 0 },
      { "start_hour": 6, "end_hour": 9, "label": "normal", "adjustment_pct": 0 },
      { "start_hour": 9, "end_hour": 17, "label": "solar", "adjustment_pct": -15 },
      { "start_hour": 17, "end_hour": 22, "label": "peak", "adjustment_pct": 20 },
      { "start_hour": 22, "end_hour": 24, "label": "normal", "adjustment_pct": 0 }
    ]
  }
}
```

Response (illustrative):

```json
{
  "baseline": {
    "items": [{ "appliance_id": 1, "hours": [19, 20] }],
    "hourly_load": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.5,0.5,0,0,0],
    "hourly_cost": [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4.2,4.2,0,0,0],
    "total_cost": 8.4,
    "peak_load": 0.5
  },
  "optimised": {
    "items": [{ "appliance_id": 1, "hours": [9, 10] }],
    "hourly_load": [0,0,0,0,0,0,0,0,0,0.5,0.5,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "hourly_cost": [0,0,0,0,0,0,0,0,0,2.975,2.975,0,0,0,0,0,0,0,0,0,0,0,0,0],
    "total_cost": 5.95,
    "peak_load": 0.5
  },
  "savings": { "daily": 2.45, "monthly": 73.5, "yearly": 894.25, "percent": 29.17 },
  "warnings": []
}
```

- `hours` lists clock hours 0-23. A non-interruptible appliance gets one continuous block (it may wrap past midnight). An interruptible appliance may get non-contiguous hours.
- `hourly_load` and `hourly_cost` always have 24 values. `warnings` is a list of messages.

`POST /api/schedule/evaluate`

Request: `{ "appliances": [...], "tariff": {...}, "items": [{ "appliance_id": 1, "hours": [9, 10] }] }`

Response: one schedule result with the same shape as `baseline` above (`items`, `hourly_load`, `hourly_cost`, `total_cost`, `peak_load`). It is used for a manual schedule, for example after a drag.

## Scenarios

A scenario is a named set of appliances plus one tariff.

`GET /api/scenarios` returns saved scenarios, newest first:

```json
[{ "id": 2, "name": "My flat", "created_at": "2026-11-21T09:30:00" }]
```

`POST /api/scenarios` (HTTP 201)

Request:

```json
{
  "name": "My flat",
  "appliances": [
    {
      "name": "Water pump",
      "power_kw": 0.75,
      "duration_h": 1,
      "category": "flexible",
      "interruptible": false,
      "preferred_start": 18,
      "earliest_start": 6,
      "deadline": 20
    }
  ],
  "tariff": {
    "base_rate": 7.0,
    "max_load_kw": 5.0,
    "slots": [
      { "start_hour": 0, "end_hour": 24, "label": "normal", "adjustment_pct": 0 }
    ]
  }
}
```

`name` must be 1 to 100 characters. The response is the scenario detail (below).

`GET /api/scenarios/{id}` returns the scenario detail:

```json
{
  "id": 2,
  "name": "My flat",
  "created_at": "2026-11-21T09:30:00",
  "appliances": [
    {
      "id": 7,
      "scenario_id": 2,
      "name": "Water pump",
      "power_kw": 0.75,
      "duration_h": 1,
      "category": "flexible",
      "interruptible": false,
      "preferred_start": 18,
      "earliest_start": 6,
      "deadline": 20
    }
  ],
  "tariff": {
    "id": 2,
    "scenario_id": 2,
    "base_rate": 7.0,
    "max_load_kw": 5.0,
    "slots": [
      { "start_hour": 0, "end_hour": 24, "label": "normal", "adjustment_pct": 0 }
    ]
  }
}
```

`DELETE /api/scenarios/{id}` returns HTTP 204 with no body. It also deletes the scenario appliances, tariff and slots. A missing id returns 404.

`POST /api/scenarios/seed` creates the "Sample Household" scenario and returns the scenario detail. It is idempotent: if "Sample Household" already exists it returns the existing one (HTTP 200) and creates nothing. A new one returns HTTP 201.

"""Cost helpers. Pure functions: no database, no FastAPI.

Inputs can be plain dicts or Pydantic objects (get_value handles both).
Money is rounded to 2 decimals and load to 3 decimals in the OUTPUT only.
"""

DAYS_PER_MONTH = 30
DAYS_PER_YEAR = 365


def get_value(obj, key):
    """Read a field from a dict or from an object with attributes."""
    if isinstance(obj, dict):
        return obj[key]
    return getattr(obj, key)


def build_hourly_rates(tariff):
    """Return a list of 24 rates (Rs/kWh). rate = base * (1 + adjustment/100)."""
    base = get_value(tariff, "base_rate")
    rates = [None] * 24
    for slot in get_value(tariff, "slots"):
        start = get_value(slot, "start_hour")
        end = get_value(slot, "end_hour")  # exclusive
        adj = get_value(slot, "adjustment_pct")
        for h in range(start, end):
            rates[h] = base * (1 + adj / 100)
    if any(r is None for r in rates):
        raise ValueError("Tariff slots do not cover all 24 hours")
    return rates


def hours_of(start, duration):
    """Hours used by a run that begins at `start`; wraps past midnight."""
    return [(start + i) % 24 for i in range(duration)]


def compute_result(appliances, items, tariff):
    """Build a ScheduleResult-shaped dict from chosen hours.

    items = [{"appliance_id": int, "hours": [int, ...]}, ...]
    """
    power_by_id = {get_value(a, "id"): get_value(a, "power_kw") for a in appliances}
    rates = build_hourly_rates(tariff)

    hourly_load = [0.0] * 24
    out_items = []
    for item in items:
        app_id = get_value(item, "appliance_id")
        hours = list(get_value(item, "hours"))
        if app_id not in power_by_id:
            raise ValueError(f"Unknown appliance id {app_id}")
        for h in hours:
            hourly_load[h] += power_by_id[app_id]
        out_items.append({"appliance_id": app_id, "hours": hours})

    hourly_cost = [hourly_load[h] * rates[h] for h in range(24)]
    return {
        "items": out_items,
        "hourly_load": [round(x, 3) for x in hourly_load],
        "hourly_cost": [round(x, 2) for x in hourly_cost],
        "total_cost": round(sum(hourly_cost), 2),
        "peak_load": round(max(hourly_load), 3),
    }


def compute_savings(baseline_cost, optimised_cost):
    """Daily saving, then x30 for monthly and x365 for yearly."""
    daily = baseline_cost - optimised_cost
    percent = (daily / baseline_cost * 100) if baseline_cost > 0 else 0.0
    return {
        "daily": round(daily, 2),
        "monthly": round(daily * DAYS_PER_MONTH, 2),
        "yearly": round(daily * DAYS_PER_YEAR, 2),
        "percent": round(percent, 2),
    }

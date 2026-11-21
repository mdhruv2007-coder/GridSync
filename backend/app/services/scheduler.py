"""Constraint-based scheduler. Pure functions: no database, no FastAPI.

Time model: circular 24-slot day. A window may cross midnight.
"""
from copy import deepcopy

from app.schemas.tariff import TariffSlotSchema, check_slots_cover_24h
from app.services.cost import (
    build_hourly_rates,
    compute_result,
    compute_savings,
    get_value,
    hours_of,
)

EPS = 1e-9  # tolerance for float comparisons on load


def _to_dict(obj):
    """Accept dicts or Pydantic objects."""
    return obj if isinstance(obj, dict) else obj.model_dump()


def validate_tariff(tariff):
    """Re-use the schema check: slots must cover 24 hours exactly once."""
    slots = []
    for s in get_value(tariff, "slots"):
        slots.append(s if isinstance(s, TariffSlotSchema) else TariffSlotSchema(**_to_dict(s)))
    check_slots_cover_24h(slots)


def window_length(earliest, deadline):
    """Number of hours between earliest_start and deadline (circular).

    deadline 24 is the same as 0. Equal values mean the whole day (24).
    """
    length = (deadline % 24 - earliest) % 24
    return length if length != 0 else 24


def _place_non_interruptible(app, load, rates, max_load):
    """Try every start inside the window; return the best hour list or None."""
    power, dur = app["power_kw"], app["duration_h"]
    earliest = app["earliest_start"]
    wlen = window_length(earliest, app["deadline"])
    current_peak = max(load)
    best_key, best_hours = None, None

    for offset in range(0, wlen - dur + 1):       # empty if dur > wlen
        hrs = hours_of((earliest + offset) % 24, dur)
        if any(load[h] + power > max_load + EPS for h in hrs):
            continue                               # would break the load limit
        cost = sum(power * rates[h] for h in hrs)
        new_peak = max(current_peak, max(load[h] + power for h in hrs))
        key = (round(cost, 9), new_peak, offset)   # cost, then peak, then earliest
        if best_key is None or key < best_key:
            best_key, best_hours = key, hrs
    return best_hours


def _place_interruptible(app, load, rates, max_load):
    """Pick the cheapest `duration_h` distinct hours inside the window."""
    power, dur = app["power_kw"], app["duration_h"]
    earliest = app["earliest_start"]
    wlen = window_length(earliest, app["deadline"])
    if dur > wlen:
        return None
    window = [(earliest + i) % 24 for i in range(wlen)]
    ok = [h for h in window if load[h] + power <= max_load + EPS]
    if len(ok) < dur:
        return None
    ok.sort(key=lambda h: (rates[h], h))           # cheapest first, then lower hour
    chosen = ok[:dur]
    chosen.sort(key=lambda h: (h - earliest) % 24)  # show in time order
    return chosen


def optimise(appliances, tariff):
    """Return {baseline, optimised, savings, warnings}."""
    apps = [_to_dict(a) for a in appliances]
    rates = build_hourly_rates(tariff)
    max_load = get_value(tariff, "max_load_kw")
    warnings = []

    # --- BASELINE: everything at its usual time ---
    baseline_items = [
        {"appliance_id": a["id"], "hours": hours_of(a["preferred_start"], a["duration_h"])}
        for a in apps
    ]
    baseline = compute_result(apps, baseline_items, tariff)

    # --- OPTIMISED ---
    load = [0.0] * 24
    placed = {}  # appliance id -> hours

    # fixed appliances first; they never move
    for a in apps:
        if a["category"] == "fixed":
            hrs = hours_of(a["preferred_start"], a["duration_h"])
            placed[a["id"]] = hrs
            for h in hrs:
                load[h] += a["power_kw"]

    # flexible: tightest window first, then biggest energy first
    flexible = [a for a in apps if a["category"] == "flexible"]
    flexible.sort(
        key=lambda a: (
            window_length(a["earliest_start"], a["deadline"]),
            -(a["power_kw"] * a["duration_h"]),
            a["id"],
        )
    )

    for a in flexible:
        if a["interruptible"]:
            hrs = _place_interruptible(a, load, rates, max_load)
        else:
            hrs = _place_non_interruptible(a, load, rates, max_load)

        if hrs is None:  # no feasible placement: keep the usual time
            hrs = hours_of(a["preferred_start"], a["duration_h"])
            warnings.append(f"{a['name']}: no feasible window, kept at usual time")

        placed[a["id"]] = hrs
        for h in hrs:
            load[h] += a["power_kw"]

    optimised_items = [{"appliance_id": a["id"], "hours": placed[a["id"]]} for a in apps]
    optimised = compute_result(apps, optimised_items, tariff)

    # safety rule: optimised must never cost more than baseline
    if optimised["total_cost"] > baseline["total_cost"]:
        optimised = deepcopy(baseline)
        warnings.append("Optimised plan was not cheaper, kept the baseline schedule")

    savings = compute_savings(baseline["total_cost"], optimised["total_cost"])
    return {
        "baseline": baseline,
        "optimised": optimised,
        "savings": savings,
        "warnings": warnings,
    }


def evaluate_schedule(appliances, items, tariff):
    """Cost and load for a manual schedule (used when the user drags)."""
    apps = [_to_dict(a) for a in appliances]
    return compute_result(apps, [_to_dict(i) for i in items], tariff)

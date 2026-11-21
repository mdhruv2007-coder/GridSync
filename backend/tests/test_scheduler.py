"""Tests for scheduler.py: the eight required cases from the build plan."""
import pytest

from app.services.scheduler import (
    evaluate_schedule,
    optimise,
    validate_tariff,
    window_length,
)

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


def make(id, name, power, dur, cat="flexible", inter=False, pref=0, earliest=None, deadline=None):
    """Small helper to build an appliance dict."""
    return {
        "id": id, "name": name, "power_kw": power, "duration_h": dur,
        "category": cat, "interruptible": inter, "preferred_start": pref,
        "earliest_start": earliest, "deadline": deadline,
    }


def hours_for(schedule, app_id):
    for item in schedule["items"]:
        if item["appliance_id"] == app_id:
            return item["hours"]


def window_hours(earliest, deadline):
    """Set of hours inside the circular window."""
    return {(earliest + i) % 24 for i in range(window_length(earliest, deadline))}


def never_worse(result):
    """Case 8: optimised <= baseline."""
    assert result["optimised"]["total_cost"] <= result["baseline"]["total_cost"] + 1e-9


# Case 1
def test_washing_machine_moves_into_solar_hours():
    wm = make(1, "Washing Machine", 0.5, 2, pref=19, earliest=8, deadline=22)
    res = optimise([wm], TARIFF)
    hrs = hours_for(res["optimised"], 1)
    assert all(9 <= h <= 16 for h in hrs)
    assert res["optimised"]["total_cost"] < res["baseline"]["total_cost"]
    never_worse(res)


# Case 2
def test_geyser_stays_inside_wrapping_window():
    geyser = make(1, "Geyser", 2.0, 1, pref=6, earliest=22, deadline=7)
    res = optimise([geyser], TARIFF)
    hrs = hours_for(res["optimised"], 1)
    assert len(hrs) == 1
    assert set(hrs) <= window_hours(22, 7)   # 22,23,0..6
    never_worse(res)


# Case 3
def test_interruptible_ev_picks_cheapest_hours():
    ev = make(1, "EV Charger", 3.3, 4, inter=True, pref=18, earliest=18, deadline=7)
    res = optimise([ev], TARIFF)
    hrs = hours_for(res["optimised"], 1)
    assert len(hrs) == 4 and len(set(hrs)) == 4
    assert set(hrs) <= window_hours(18, 7)
    assert not set(hrs) & {18, 19, 20, 21}               # never in peak
    assert set(hrs) <= {0, 1, 2, 3, 4, 5}                 # tie-break picks lowest hours
    assert res["optimised"]["total_cost"] == pytest.approx(4 * 3.3 * 7.0)
    never_worse(res)


# Case 4
def test_max_load_blocks_two_big_appliances_in_same_hour():
    a = make(1, "Heater A", 3.0, 1, pref=9, earliest=9, deadline=12)
    b = make(2, "Heater B", 3.0, 1, pref=9, earliest=9, deadline=12)
    res = optimise([a, b], TARIFF)
    assert not set(hours_for(res["optimised"], 1)) & set(hours_for(res["optimised"], 2))
    assert res["optimised"]["peak_load"] <= TARIFF["max_load_kw"] + 1e-9
    never_worse(res)


# Case 5
def test_infeasible_duration_keeps_usual_time_and_warns():
    big = make(1, "Washing Machine", 0.5, 5, pref=18, earliest=9, deadline=12)  # window is 3h
    res = optimise([big], TARIFF)
    assert hours_for(res["optimised"], 1) == [18, 19, 20, 21, 22]
    assert any("Washing Machine" in w and "no feasible window" in w for w in res["warnings"])
    never_worse(res)


# Case 6
def test_fixed_appliances_never_move():
    fridge = make(1, "Fridge", 0.15, 24, cat="fixed", pref=0)
    lights = make(2, "LED lights", 0.1, 5, cat="fixed", pref=18)
    wm = make(3, "Washing Machine", 0.5, 2, pref=19, earliest=8, deadline=22)
    res = optimise([fridge, lights, wm], TARIFF)
    for app_id in (1, 2):
        assert hours_for(res["baseline"], app_id) == hours_for(res["optimised"], app_id)
    assert hours_for(res["optimised"], 2) == [18, 19, 20, 21, 22]
    never_worse(res)


# Case 7
def test_tariff_validation_rejects_gap_and_overlap():
    gap = dict(TARIFF, slots=[
        {"start_hour": 0, "end_hour": 10, "label": "offpeak", "adjustment_pct": 0},
        {"start_hour": 12, "end_hour": 24, "label": "normal", "adjustment_pct": 0},
    ])
    overlap = dict(TARIFF, slots=[
        {"start_hour": 0, "end_hour": 12, "label": "offpeak", "adjustment_pct": 0},
        {"start_hour": 10, "end_hour": 24, "label": "normal", "adjustment_pct": 0},
    ])
    with pytest.raises(ValueError, match="missing"):
        validate_tariff(gap)
    with pytest.raises(ValueError, match="overlapping"):
        validate_tariff(overlap)
    validate_tariff(TARIFF)   # a good tariff passes without error


# Case 8 on the full sample household
def test_sample_household_optimised_not_worse():
    apps = [
        make(1, "Fridge", 0.15, 24, cat="fixed", pref=0),
        make(2, "LED lights", 0.1, 5, cat="fixed", pref=18),
        make(3, "Water heater", 2.0, 1, pref=6, earliest=22, deadline=7),
        make(4, "Washing machine", 0.5, 2, pref=19, earliest=8, deadline=22),
        make(5, "EV charger", 3.3, 4, inter=True, pref=18, earliest=18, deadline=7),
        make(6, "Water pump", 0.75, 1, pref=18, earliest=6, deadline=20),
    ]
    res = optimise(apps, TARIFF)
    never_worse(res)
    assert res["savings"]["daily"] > 0
    assert res["optimised"]["peak_load"] <= TARIFF["max_load_kw"] + 1e-9


def test_evaluate_schedule_manual_items():
    wm = make(1, "Washing Machine", 0.5, 2, pref=19, earliest=8, deadline=22)
    res = evaluate_schedule([wm], [{"appliance_id": 1, "hours": [9, 10]}], TARIFF)
    assert res["total_cost"] == pytest.approx(0.5 * 5.95 * 2)

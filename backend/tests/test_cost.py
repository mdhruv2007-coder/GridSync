"""Tests for cost.py: rate table, wrap-around hours, cost sum, savings maths."""
import pytest

from app.services.cost import (
    build_hourly_rates,
    compute_result,
    compute_savings,
    hours_of,
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


def test_rate_table_has_24_correct_rates():
    rates = build_hourly_rates(TARIFF)
    assert len(rates) == 24
    assert rates[0] == pytest.approx(7.0)    # offpeak
    assert rates[8] == pytest.approx(7.0)    # normal
    assert rates[9] == pytest.approx(5.95)   # solar start
    assert rates[16] == pytest.approx(5.95)  # solar end
    assert rates[17] == pytest.approx(8.4)   # peak start
    assert rates[21] == pytest.approx(8.4)   # peak end
    assert rates[22] == pytest.approx(7.0)   # normal again


def test_hours_of_simple_and_wraparound():
    assert hours_of(9, 3) == [9, 10, 11]
    assert hours_of(22, 4) == [22, 23, 0, 1]   # crosses midnight
    assert len(hours_of(0, 24)) == 24


def test_cost_is_load_times_rate_summed():
    apps = [{"id": 1, "power_kw": 2.0}]
    items = [{"appliance_id": 1, "hours": [17, 18]}]   # two peak hours
    res = compute_result(apps, items, TARIFF)
    assert res["total_cost"] == pytest.approx(2.0 * 8.4 * 2)   # 33.6
    assert res["hourly_load"][17] == pytest.approx(2.0)
    assert res["hourly_cost"][17] == pytest.approx(16.8)
    assert res["hourly_load"][0] == 0


def test_overlapping_appliances_add_load_and_peak():
    apps = [{"id": 1, "power_kw": 2.0}, {"id": 2, "power_kw": 1.5}]
    items = [
        {"appliance_id": 1, "hours": [10, 11]},
        {"appliance_id": 2, "hours": [11]},
    ]
    res = compute_result(apps, items, TARIFF)
    assert res["hourly_load"][11] == pytest.approx(3.5)
    assert res["peak_load"] == pytest.approx(3.5)


def test_unknown_appliance_id_raises():
    with pytest.raises(ValueError):
        compute_result([{"id": 1, "power_kw": 1.0}], [{"appliance_id": 99, "hours": [1]}], TARIFF)


def test_savings_maths():
    s = compute_savings(10.0, 7.0)
    assert s["daily"] == pytest.approx(3.0)
    assert s["monthly"] == pytest.approx(90.0)
    assert s["yearly"] == pytest.approx(1095.0)
    assert s["percent"] == pytest.approx(30.0)


def test_savings_percent_is_zero_when_baseline_is_zero():
    assert compute_savings(0, 0)["percent"] == 0

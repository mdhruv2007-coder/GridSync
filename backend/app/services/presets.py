"""Tariff presets and the sample scenario loader. All values are SAMPLES."""
import json
from copy import deepcopy
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "sample_scenario.json"

# Same slot layout for all three presets (editable samples, not real rates)
SAMPLE_SLOTS = [
    {"start_hour": 0, "end_hour": 6, "label": "offpeak", "adjustment_pct": 0},
    {"start_hour": 6, "end_hour": 9, "label": "normal", "adjustment_pct": 0},
    {"start_hour": 9, "end_hour": 17, "label": "solar", "adjustment_pct": -15},
    {"start_hour": 17, "end_hour": 22, "label": "peak", "adjustment_pct": 20},
    {"start_hour": 22, "end_hour": 24, "label": "normal", "adjustment_pct": 0},
]


def get_presets():
    """List of tariff presets for GET /api/tariff/presets."""
    def make(name, description, max_load_kw):
        return {
            "name": name,
            "description": description,
            "base_rate": 7.0,
            "max_load_kw": max_load_kw,
            "slots": deepcopy(SAMPLE_SLOTS),
        }

    return [
        make("Sample ToD (editable)", "Sample tariff for a household. Edit to match your bill.", 5.0),
        make("Hostel / PG", "Sample tariff for a hostel or PG (higher load limit).", 15.0),
        make("College Canteen", "Sample tariff for a canteen (highest load limit).", 25.0),
    ]


def load_sample_scenario():
    """Read the Sample Household scenario (utf-8-sig tolerates a BOM)."""
    with open(DATA_FILE, "r", encoding="utf-8-sig") as f:
        return json.load(f)

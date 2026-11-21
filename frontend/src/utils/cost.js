// Client-side cost maths. It mirrors backend/app/services/cost.py so the cost
// meter can update instantly while the user drags an appliance.
import { hoursOf } from './time'

function round(n, dp) {
  const f = 10 ** dp
  return Math.round((n + Number.EPSILON) * f) / f
}

// The tariff slot that covers a clock hour (or null if there is a gap).
export function slotForHour(tariff, hour) {
  return tariff.slots.find((s) => hour >= s.start_hour && hour < s.end_hour) || null
}

// 24 rates in Rs/kWh. Throws if the slots leave a gap.
export function buildHourlyRates(tariff) {
  const rates = []
  for (let h = 0; h < 24; h++) {
    const slot = slotForHour(tariff, h)
    if (!slot) throw new Error(`No tariff slot covers hour ${h}`)
    rates.push(tariff.base_rate * (1 + slot.adjustment_pct / 100))
  }
  return rates
}

// BASELINE schedule: every appliance runs at its usual (preferred) start time.
export function baselineItems(appliances) {
  return appliances.map((a) => ({
    appliance_id: a.id,
    hours: hoursOf(a.preferred_start, a.duration_h),
  }))
}

// Same shape as the backend ScheduleResult.
export function computeResult(appliances, items, tariff) {
  const rates = buildHourlyRates(tariff)
  const byId = new Map(appliances.map((a) => [a.id, a]))
  const load = Array(24).fill(0)

  for (const item of items) {
    const appliance = byId.get(item.appliance_id)
    if (!appliance) throw new Error(`Unknown appliance id ${item.appliance_id}`)
    for (const h of item.hours) {
      if (h < 0 || h > 23) throw new Error(`Hour ${h} is outside 0-23`)
      load[h] += appliance.power_kw
    }
  }

  const cost = load.map((kw, h) => kw * rates[h]) // 1 hour per slot, so kW = kWh
  return {
    items: items.map((i) => ({ appliance_id: i.appliance_id, hours: [...i.hours] })),
    hourly_load: load.map((v) => round(v, 3)),
    hourly_cost: cost.map((v) => round(v, 2)),
    total_cost: round(cost.reduce((a, b) => a + b, 0), 2),
    peak_load: round(Math.max(...load), 3),
  }
}

// An all-zero result (used when the tariff is incomplete while being edited).
export function emptyResult() {
  return {
    items: [],
    hourly_load: Array(24).fill(0),
    hourly_cost: Array(24).fill(0),
    total_cost: 0,
    peak_load: 0,
  }
}

export function computeSavings(baselineCost, optimisedCost) {
  const daily = baselineCost - optimisedCost
  return {
    daily: round(daily, 2),
    monthly: round(daily * 30, 2),
    yearly: round(daily * 365, 2),
    percent: baselineCost > 0 ? round((daily / baselineCost) * 100, 2) : 0,
  }
}

// Does this result break the load limit? (Used to reject a drop.)
export function exceedsMaxLoad(result, tariff) {
  return result.peak_load > tariff.max_load_kw + 1e-9
}

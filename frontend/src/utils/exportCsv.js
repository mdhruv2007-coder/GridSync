// exportCsv.js - pure helpers (no React) that turn the optimised schedule into a CSV file.
import { hourLabel } from './time'
import { buildHourlyRates } from './cost'

// Wrap a field in quotes if it contains a comma, a quote or a line break.
function csvField(value) {
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"'
  }
  return text
}

// Start hours = hours whose previous hour (circular, 24-hour day) is NOT in the list.
function findStartHours(hours) {
  const set = new Set(hours)
  return hours.filter((h) => !set.has((h + 23) % 24))
}

// Build the CSV text. Columns are plain ASCII, no rupee sign.
export function buildScheduleCsv(appliances, tariff, optimised) {
  if (!optimised || !Array.isArray(optimised.items)) {
    throw new Error('Optimise first.')
  }
  const rates = buildHourlyRates(tariff)
  const header = [
    'appliance',
    'power_kw',
    'duration_h',
    'baseline_start',
    'optimised_start',
    'optimised_hours',
    'daily_cost_rs',
  ]
  const lines = [header.join(',')]
  let total = 0

  for (const a of appliances) {
    const item = optimised.items.find((i) => i.appliance_id === a.id)
    const hours = [...new Set(item ? item.hours : [])].sort((x, y) => x - y)
    const starts = findStartHours(hours)

    let startText = ''
    let orderedHours = hours
    if (hours.length > 0 && starts.length === 1) {
      // One contiguous (possibly wrapping) block: show one start, hours in running order.
      const s = starts[0]
      startText = hourLabel(s)
      orderedHours = [...hours].sort((x, y) => ((x - s + 24) % 24) - ((y - s + 24) % 24))
    } else if (hours.length > 0 && starts.length === 0) {
      // Runs all 24 hours (for example the fridge): no logical start, use the first hour.
      startText = hourLabel(hours[0])
    } else if (hours.length > 0) {
      // Non-contiguous (interruptible): list every hour.
      startText = hours.map(hourLabel).join(' ')
    }

    // Daily cost = sum of power x hourly rate over the optimised hours.
    let cost = 0
    for (const h of hours) {
      cost += a.power_kw * rates[h]
    }
    total += cost

    const row = [
      csvField(a.name),
      csvField(a.power_kw),
      csvField(a.duration_h),
      csvField(hourLabel(a.preferred_start)),
      csvField(startText),
      csvField(orderedHours.map(hourLabel).join(' ')),
      cost.toFixed(2),
    ]
    lines.push(row.join(','))
  }

  // Final TOTAL row (only the cost column is filled).
  lines.push(['TOTAL', '', '', '', '', '', total.toFixed(2)].join(','))
  return lines.join('\r\n') + '\r\n'
}

// Download text as a file: Blob -> object URL -> temporary <a download> click -> revoke.
export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

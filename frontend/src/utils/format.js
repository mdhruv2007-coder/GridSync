// Display helpers and the single place where tariff colours are defined.

const RUPEE = '\u20B9' // written as an escape so the file stays plain ASCII

export function formatRs(n) {
  const value = Number.isFinite(n) ? n : 0
  return `${RUPEE}${value.toFixed(2)}`
}

export function formatPercent(n) {
  const value = Number.isFinite(n) ? n : 0
  return `${value.toFixed(1)}%`
}

export function formatKw(n) {
  const value = Number.isFinite(n) ? n : 0
  return `${value.toFixed(2)} kW`
}

// Tailwind classes per slot label. Always show `name` as text next to the colour.
export const LABEL_STYLES = {
  solar: { name: 'Solar', bg: 'bg-solar-light', solid: 'bg-solar', text: 'text-solar-dark', border: 'border-solar' },
  normal: { name: 'Normal', bg: 'bg-normal-light', solid: 'bg-normal', text: 'text-normal-dark', border: 'border-normal' },
  peak: { name: 'Peak', bg: 'bg-peak-light', solid: 'bg-peak', text: 'text-peak-dark', border: 'border-peak' },
  offpeak: { name: 'Off-peak', bg: 'bg-offpeak-light', solid: 'bg-offpeak', text: 'text-offpeak-dark', border: 'border-offpeak' },
}

// Same colours as hex, for recharts (which does not use Tailwind classes).
export const LABEL_COLORS = {
  solar: '#16a34a',
  normal: '#64748b',
  peak: '#ea580c',
  offpeak: '#4f46e5',
}

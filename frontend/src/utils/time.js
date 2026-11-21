// Time helpers. The day is a CIRCULAR 24-slot clock: hour 23 is followed by hour 0.

// Hours an appliance occupies when it starts at `start` for `duration` hours.
export function hoursOf(start, duration) {
  return Array.from({ length: duration }, (_, i) => (start + i) % 24)
}

// Number of hours in the window [earliest, deadline). Deadline 24 equals 0.
// If earliest equals deadline the window is the whole day (24).
export function windowLength(earliest, deadline) {
  const len = (((deadline % 24) - earliest) % 24 + 24) % 24
  return len === 0 ? 24 : len
}

// Is a single clock hour inside the window?
export function isHourInWindow(hour, earliest, deadline) {
  const offset = (((hour - earliest) % 24) + 24) % 24
  return offset < windowLength(earliest, deadline)
}

// Can a flexible appliance run in one block starting at `start` and still
// finish by its deadline? (Used to accept or reject a drag-and-drop.)
export function canPlaceAt(appliance, start) {
  if (appliance.category !== 'flexible') return false
  const len = windowLength(appliance.earliest_start, appliance.deadline)
  const offset = (((start - appliance.earliest_start) % 24) + 24) % 24
  return offset + appliance.duration_h <= len
}

// 6 -> "06:00"
export function hourLabel(hour) {
  return `${String(hour % 24).padStart(2, '0')}:00`
}

// (22, 3) -> "22:00 - 01:00"
export function rangeLabel(start, duration) {
  return `${hourLabel(start)} - ${hourLabel(start + duration)}`
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i)

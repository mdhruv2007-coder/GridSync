// SlotBar.jsx - 24-hour bar coloured by tariff slot. Receives ONLY numerically valid slots:
//   [{ start_hour, end_hour, label }, ...]
// Each hour is "gap" (no slot), "overlap" (2+ slots) or the slot label.
// Neighbouring hours with the same state are merged into one segment so the NAME fits as text.
import { LABEL_STYLES } from '../../utils/format';
import { HOURS } from '../../utils/time';

const GRID = { gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' };

// Grey diagonal stripes for hours that have no slot
const HATCH = {
  backgroundImage:
    'repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 6px, #f8fafc 6px, #f8fafc 12px)',
};

// For each hour 0..23 decide its state
function hourStates(slots) {
  return HOURS.map((h) => {
    const hits = slots.filter((s) => h >= s.start_hour && h < s.end_hour);
    if (hits.length === 0) return 'gap';
    if (hits.length > 1) return 'overlap';
    return hits[0].label;
  });
}

// Merge consecutive equal states: ['peak','peak','gap'] -> [{key:'peak',length:2},{key:'gap',length:1}]
function toRuns(states) {
  const runs = [];
  states.forEach((key, hour) => {
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.length += 1;
    else runs.push({ key, start: hour, length: 1 });
  });
  return runs;
}

function segmentLook(key) {
  if (key === 'gap') {
    return { name: 'no slot', className: 'border border-dashed border-slate-400 text-slate-600', style: HATCH };
  }
  if (key === 'overlap') {
    return { name: 'overlap', className: 'border border-red-500 bg-red-100 text-red-800', style: {} };
  }
  const st = LABEL_STYLES[key] || LABEL_STYLES.normal;
  return { name: st.name, className: `border ${st.bg} ${st.text} ${st.border}`, style: {} };
}

export default function SlotBar({ slots }) {
  const runs = toRuns(hourStates(slots));

  return (
    // min-w keeps the bar readable; the wrapper scrolls on small screens
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid gap-px" style={GRID}>
          {runs.map((r) => {
            const look = segmentLook(r.key);
            return (
              <div
                key={r.start}
                title={`${look.name}: ${r.start}:00 to ${r.start + r.length}:00`}
                className={`flex h-10 items-center justify-center truncate px-1 text-xs font-semibold ${look.className}`}
                style={{ gridColumn: `span ${r.length} / span ${r.length}`, ...look.style }}
              >
                {look.name}
              </div>
            );
          })}
        </div>
        {/* hour numbers: one cell per hour */}
        <div className="mt-1 grid" style={GRID}>
          {HOURS.map((h) => (
            <div key={h} className="text-center text-[10px] text-slate-500">
              {h}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

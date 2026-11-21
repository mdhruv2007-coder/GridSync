// LoadCurve: hourly load (kW), baseline versus optimised, with the max-load line
// and the tariff slots shaded in the background.
// A bar chart is used so that each hour is a full band and the shading lines up.
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { HOURS, hourLabel } from '../../utils/time';
import { formatKw, LABEL_STYLES, LABEL_COLORS } from '../../utils/format';

// Find the tariff slot that contains an hour (or undefined).
function slotAt(slots, hour) {
  return slots.find((s) => hour >= s.start_hour && hour < s.end_hour);
}

// Tooltip: shows the hour, the slot NAME (text, not only colour) and both loads.
function LoadTooltip({ active, payload, label, slots }) {
  if (!active || !payload || payload.length === 0) return null;
  const hour = Number(label);
  const slot = slotAt(slots, hour);
  const style = slot ? LABEL_STYLES[slot.label] : null;
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2 text-xs shadow">
      <p className="font-semibold">
        {hourLabel(hour)}
        {style ? ' (' + style.name + ')' : ''}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {formatKw(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function LoadCurve({ baseline, optimised, tariff }) {
  const slots = Array.isArray(tariff.slots) ? tariff.slots : [];
  const baseLoad = (baseline && baseline.hourly_load) || [];
  const optLoad = optimised ? optimised.hourly_load || [] : null;

  // One row per hour for recharts.
  const data = HOURS.map((h) => ({
    hour: h,
    baseline: baseLoad[h] || 0,
    optimised: optLoad ? optLoad[h] || 0 : undefined,
  }));

  const maxLoad = Number(tariff.max_load_kw);

  // Unique slot labels for the text legend under the chart.
  const labelsUsed = [...new Set(slots.map((s) => s.label))];

  return (
    <div>
      <p className="mb-1 text-xs text-slate-500">Load in kW per hour (0 to 23)</p>
      {/* Fixed height wrapper so ResponsiveContainer does not collapse to 0 */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

            {/* Tariff slots shaded with low opacity, last hour of the slot is end_hour - 1 */}
            {slots.map((s, i) => (
              <ReferenceArea
                key={i}
                x1={s.start_hour}
                x2={s.end_hour - 1}
                fill={LABEL_COLORS[s.label]}
                fillOpacity={0.12}
              />
            ))}

            <XAxis dataKey="hour" interval={0} tick={{ fontSize: 10 }} />
            <YAxis
              width={44}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => Number(v).toFixed(1)}
              domain={[0, (dataMax) => Math.max(dataMax, maxLoad || 0) * 1.15]}
            />
            <Tooltip content={(props) => <LoadTooltip {...props} slots={slots} />} />
            <Legend />

            {Number.isFinite(maxLoad) && (
              <ReferenceLine
                y={maxLoad}
                stroke="#dc2626"
                strokeDasharray="6 4"
                label={{ value: 'Max load', position: 'insideTopRight', fill: '#dc2626', fontSize: 11 }}
              />
            )}

            <Bar dataKey="baseline" name="Baseline" fill="#94a3b8" isAnimationActive={false} />
            {optimised && (
              <Bar dataKey="optimised" name="Optimised" fill="#4f46e5" isAnimationActive={false} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Text legend for the shaded slots */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
        {labelsUsed.map((l) => (
          <span key={l} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-slate-300"
              style={{ backgroundColor: LABEL_COLORS[l], opacity: 0.5 }}
            />
            {LABEL_STYLES[l] ? LABEL_STYLES[l].name : l}
          </span>
        ))}
      </div>

      <p className="mt-2 text-sm text-slate-700">
        Peak load: baseline {formatKw((baseline && baseline.peak_load) || 0)}
        {optimised ? ', optimised ' + formatKw(optimised.peak_load || 0) : ''}. Limit {formatKw(maxLoad || 0)}.
      </p>
    </div>
  );
}

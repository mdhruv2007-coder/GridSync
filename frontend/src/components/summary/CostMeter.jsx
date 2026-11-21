// CostMeter: one summary card with a single figure (cost or percent).
// Shows "-" and a hint when value is null (before Optimise is clicked).
import { formatRs, formatPercent } from '../../utils/format';

// Card background per tone (colour tokens come from tailwind.config.js).
const CARD_TONES = {
  neutral: 'border-slate-200 bg-white',
  good: 'border-solar bg-solar-light',
  info: 'border-offpeak bg-offpeak-light',
};

// Big number colour per tone.
const VALUE_TONES = {
  neutral: 'text-slate-900',
  good: 'text-solar-dark',
  info: 'text-offpeak-dark',
};

export default function CostMeter({
  label,
  value,
  hint,
  tone = 'neutral',
  kind = 'rs', // 'rs' for rupees, 'percent' for a percentage
  showProjection = false, // show monthly and yearly estimates under the figure
}) {
  const hasValue = typeof value === 'number' && !Number.isNaN(value);
  const text = !hasValue ? '-' : kind === 'percent' ? formatPercent(value) : formatRs(value);

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${CARD_TONES[tone] || CARD_TONES.neutral}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${VALUE_TONES[tone] || VALUE_TONES.neutral}`}>{text}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}

      {/* Simple projection: daily cost x 30 days and x 365 days (modelled). */}
      {showProjection && hasValue && kind === 'rs' && (
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
          <div>
            <dt>Monthly (x30)</dt>
            <dd className="font-semibold">{formatRs(value * 30)}</dd>
          </div>
          <div>
            <dt>Yearly (x365)</dt>
            <dd className="font-semibold">{formatRs(value * 365)}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}

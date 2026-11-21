// TariffEditor.jsx - edit base rate, max load and the slot table, with live validation.
// "draft" keeps everything as strings while typing; "Apply tariff" converts to numbers.
import { useEffect, useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import SlotBar from './SlotBar';
import { fetchPresets } from '../../api/tariff';
import { getErrorMessage } from '../../api/client';
import { DEFAULT_TARIFF } from '../../context/ScenarioContext';
import { HOURS } from '../../utils/time';
import { LABEL_STYLES, formatRs } from '../../utils/format';

const INPUT =
  'w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';

function toDraft(t) {
  return {
    base_rate: String(t.base_rate),
    max_load_kw: String(t.max_load_kw),
    slots: t.slots.map((s) => ({
      start_hour: String(s.start_hour),
      end_hour: String(s.end_hour),
      label: s.label,
      adjustment_pct: String(s.adjustment_pct),
    })),
  };
}

function toNumber(v) {
  return v === '' ? NaN : Number(v);
}

// Returns { errors: [text...], slots: [valid numeric slots] }
function validateDraft(draft) {
  const errors = [];
  const slots = [];

  if (!(toNumber(draft.base_rate) > 0)) errors.push('Base rate must be a number greater than 0.');
  if (!(toNumber(draft.max_load_kw) > 0)) errors.push('Max load must be a number greater than 0.');

  // Check every slot row on its own
  draft.slots.forEach((row, i) => {
    const start = toNumber(row.start_hour);
    const end = toNumber(row.end_hour);
    const adj = toNumber(row.adjustment_pct);
    const problems = [];
    if (!Number.isInteger(start) || start < 0 || start > 23) problems.push('start must be a whole hour 0-23');
    if (!Number.isInteger(end) || end < 1 || end > 24) problems.push('end must be a whole hour 1-24');
    if (Number.isInteger(start) && Number.isInteger(end) && end <= start) {
      problems.push('end must be greater than start');
    }
    if (!(adj >= -100 && adj <= 500)) problems.push('adjustment must be between -100 and 500');

    if (problems.length > 0) errors.push(`Slot ${i + 1}: ${problems.join('; ')}.`);
    else slots.push({ start_hour: start, end_hour: end, label: row.label, adjustment_pct: adj });
  });

  // Every hour must be covered exactly once
  const counts = HOURS.map((h) => slots.filter((s) => h >= s.start_hour && h < s.end_hour).length);
  const missing = HOURS.filter((h) => counts[h] === 0);
  const overlapping = HOURS.filter((h) => counts[h] > 1);
  if (missing.length > 0) errors.push(`Missing hours (no slot): ${missing.join(', ')}`);
  if (overlapping.length > 0) errors.push(`Overlapping hours (in 2+ slots): ${overlapping.join(', ')}`);

  return { errors, slots };
}

export default function TariffEditor({ tariff, onApply }) {
  const [draft, setDraft] = useState(() => toDraft(tariff));
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState('');

  // Load presets once when the page opens
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchPresets();
        // Works whether the api helper returns the list or the axios response
        const list = Array.isArray(data) ? data : data && data.data ? data.data : [];
        if (!cancelled) setPresets(list);
      } catch (err) {
        if (!cancelled) setPresetsError(getErrorMessage(err));
      } finally {
        if (!cancelled) setPresetsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const { errors, slots } = validateDraft(draft);
  const valid = errors.length === 0;
  const chosen = presets.find((p) => p.name === presetName);

  function choosePreset(name) {
    setPresetName(name);
    const p = presets.find((x) => x.name === name);
    if (p) setDraft(toDraft(p));
  }

  function updateField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function updateRow(index, field, value) {
    setDraft((d) => ({
      ...d,
      slots: d.slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  }

  function addRow() {
    setDraft((d) => ({
      ...d,
      slots: [...d.slots, { start_hour: '0', end_hour: '1', label: 'normal', adjustment_pct: '0' }],
    }));
  }

  function deleteRow(index) {
    setDraft((d) => ({ ...d, slots: d.slots.filter((_, i) => i !== index) }));
  }

  function resetToSample() {
    setDraft(toDraft(DEFAULT_TARIFF));
    setPresetName('');
  }

  function apply() {
    if (!valid) return;
    onApply({
      base_rate: Number(draft.base_rate),
      max_load_kw: Number(draft.max_load_kw),
      slots: [...slots].sort((a, b) => a.start_hour - b.start_hour),
    });
  }

  const base = toNumber(draft.base_rate);

  return (
    <div className="space-y-6">
      <Card title="Preset">
        {presetsLoading ? (
          <p className="text-sm text-slate-600">Loading presets...</p>
        ) : presetsError ? (
          <p className="text-sm font-medium text-red-600">{presetsError}</p>
        ) : (
          <div className="space-y-2">
            <select
              aria-label="Tariff preset"
              value={presetName}
              onChange={(e) => choosePreset(e.target.value)}
              className={`${INPUT} max-w-sm`}
            >
              <option value="">Choose a preset...</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
            {chosen ? <p className="text-sm text-slate-600">{chosen.description}</p> : null}
          </div>
        )}
      </Card>

      <Card title="Rates and load limit">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="t-base" className="mb-1 block text-sm font-medium text-slate-700">
              Base rate (Rs/kWh)
            </label>
            <input
              id="t-base"
              type="number"
              step="0.01"
              min="0"
              value={draft.base_rate}
              onChange={(e) => updateField('base_rate', e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="t-max" className="mb-1 block text-sm font-medium text-slate-700">
              Max load (kW)
            </label>
            <input
              id="t-max"
              type="number"
              step="0.1"
              min="0"
              value={draft.max_load_kw}
              onChange={(e) => updateField('max_load_kw', e.target.value)}
              className={INPUT}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Tariff slots"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={addRow}>
              Add row
            </Button>
            <Button size="sm" variant="ghost" onClick={resetToSample}>
              Reset to sample
            </Button>
          </>
        }
      >
        <div className="mb-4">
          <SlotBar slots={slots} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2 pr-2 font-semibold">Start hour</th>
                <th className="py-2 pr-2 font-semibold">End hour (excl.)</th>
                <th className="py-2 pr-2 font-semibold">Label</th>
                <th className="py-2 pr-2 font-semibold">Adjustment %</th>
                <th className="py-2 pr-2 font-semibold">Rate</th>
                <th className="py-2 font-semibold">Remove</th>
              </tr>
            </thead>
            <tbody>
              {draft.slots.map((row, i) => {
                const adj = toNumber(row.adjustment_pct);
                const rate = base * (1 + adj / 100);
                return (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        aria-label={`Slot ${i + 1} start hour`}
                        value={row.start_hour}
                        onChange={(e) => updateRow(i, 'start_hour', e.target.value)}
                        className={INPUT}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        aria-label={`Slot ${i + 1} end hour`}
                        value={row.end_hour}
                        onChange={(e) => updateRow(i, 'end_hour', e.target.value)}
                        className={INPUT}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        aria-label={`Slot ${i + 1} label`}
                        value={row.label}
                        onChange={(e) => updateRow(i, 'label', e.target.value)}
                        className={INPUT}
                      >
                        {Object.keys(LABEL_STYLES).map((key) => (
                          <option key={key} value={key}>
                            {LABEL_STYLES[key].name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        aria-label={`Slot ${i + 1} adjustment percent`}
                        value={row.adjustment_pct}
                        onChange={(e) => updateRow(i, 'adjustment_pct', e.target.value)}
                        className={INPUT}
                      />
                    </td>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {Number.isFinite(rate) ? `${formatRs(rate)}/kWh` : '-'}
                    </td>
                    <td className="py-2">
                      <Button size="sm" variant="danger" onClick={() => deleteRow(i)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {!valid && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          <p className="mb-1 font-semibold">Fix these problems to apply the tariff:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Button onClick={apply} disabled={!valid}>
          Apply tariff
        </Button>
      </div>
    </div>
  );
}

// ApplianceForm.jsx - add or edit one appliance.
// Values are kept as strings while typing; they become numbers only on submit.
// validate() mirrors the backend (Pydantic) rules.
import { useState } from 'react';
import Button from '../common/Button';
import { HOURS, hourLabel, windowLength } from '../../utils/time';

const EMPTY = {
  name: '',
  power_kw: '',
  duration_h: '1',
  category: 'flexible',
  interruptible: false,
  preferred_start: '18',
  earliest_start: '0',
  deadline: '24',
};

const INPUT =
  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300';

function inputClass(error) {
  return `${INPUT} ${error ? 'border-red-500' : 'border-slate-300'}`;
}

// Turn a saved appliance into form strings
function fromAppliance(a) {
  return {
    name: a.name,
    power_kw: String(a.power_kw),
    duration_h: String(a.duration_h),
    category: a.category,
    interruptible: Boolean(a.interruptible),
    preferred_start: String(a.preferred_start),
    earliest_start: a.earliest_start == null ? '0' : String(a.earliest_start),
    deadline: a.deadline == null ? '24' : String(a.deadline),
  };
}

// '' must count as "missing", but Number('') is 0, so handle it first
function toNumber(v) {
  return v === '' ? NaN : Number(v);
}

function isIntBetween(n, min, max) {
  return Number.isInteger(n) && n >= min && n <= max;
}

// Returns an object { fieldName: 'message' }. Empty object = valid.
function validate(v) {
  const errors = {};
  const name = v.name.trim();
  if (name.length < 1) errors.name = 'Name is required.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  if (!(toNumber(v.power_kw) > 0)) errors.power_kw = 'Power must be a number greater than 0.';
  if (!isIntBetween(toNumber(v.duration_h), 1, 24)) {
    errors.duration_h = 'Duration must be a whole number from 1 to 24 hours.';
  }
  if (!isIntBetween(toNumber(v.preferred_start), 0, 23)) {
    errors.preferred_start = 'Usual start must be an hour from 0 to 23.';
  }
  // Flexible appliances MUST have an earliest start and a deadline
  if (v.category === 'flexible') {
    if (!isIntBetween(toNumber(v.earliest_start), 0, 23)) {
      errors.earliest_start = 'Earliest start is required (0 to 23).';
    }
    if (!isIntBetween(toNumber(v.deadline), 0, 24)) {
      errors.deadline = 'Deadline is required (0 to 24).';
    }
  }
  return errors;
}

function deadlineLabel(h) {
  return h === 24 ? '24:00 (end of day)' : hourLabel(h);
}

// Small wrapper: label + input + inline error text
function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export default function ApplianceForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState(initial ? fromAppliance(initial) : EMPTY);
  const [submitted, setSubmitted] = useState(false); // errors appear after the first submit
  const errors = validate(values);
  const shown = submitted ? errors : {};
  const isFlexible = values.category === 'flexible';

  function change(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  // Soft hint (not blocking): the usage hours must fit inside the allowed window
  let windowWarning = '';
  if (isFlexible && !errors.earliest_start && !errors.deadline && !errors.duration_h) {
    const len = windowLength(Number(values.earliest_start), Number(values.deadline));
    if (Number(values.duration_h) > len) {
      windowWarning = `The window is only ${len} h long, shorter than the ${values.duration_h} h duration.`;
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return; // stop, errors are now visible
    onSubmit({
      name: values.name.trim(),
      power_kw: Number(values.power_kw),
      duration_h: Number(values.duration_h),
      category: values.category,
      interruptible: isFlexible ? values.interruptible : false,
      preferred_start: Number(values.preferred_start),
      earliest_start: isFlexible ? Number(values.earliest_start) : null,
      deadline: isFlexible ? Number(values.deadline) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ap-name" label="Name" error={shown.name}>
          <input
            id="ap-name"
            type="text"
            value={values.name}
            onChange={(e) => change('name', e.target.value)}
            className={inputClass(shown.name)}
            placeholder="e.g. Water heater"
          />
        </Field>

        <Field id="ap-power" label="Power (kW)" error={shown.power_kw}>
          <input
            id="ap-power"
            type="number"
            step="0.01"
            min="0"
            value={values.power_kw}
            onChange={(e) => change('power_kw', e.target.value)}
            className={inputClass(shown.power_kw)}
          />
        </Field>

        <Field id="ap-duration" label="Duration (hours)" error={shown.duration_h}>
          <input
            id="ap-duration"
            type="number"
            step="1"
            min="1"
            max="24"
            value={values.duration_h}
            onChange={(e) => change('duration_h', e.target.value)}
            className={inputClass(shown.duration_h)}
          />
        </Field>

        <Field id="ap-category" label="Category">
          <select
            id="ap-category"
            value={values.category}
            onChange={(e) => change('category', e.target.value)}
            className={inputClass(false)}
          >
            <option value="flexible">Flexible (can be moved)</option>
            <option value="fixed">Fixed (never moved)</option>
          </select>
        </Field>

        <Field id="ap-pref" label="Usual start time" error={shown.preferred_start}>
          <select
            id="ap-pref"
            value={values.preferred_start}
            onChange={(e) => change('preferred_start', e.target.value)}
            className={inputClass(shown.preferred_start)}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* These fields exist only for flexible appliances */}
      {isFlexible && (
        <div className="grid gap-4 rounded-md bg-slate-50 p-3 sm:grid-cols-2">
          <Field id="ap-earliest" label="Earliest start" error={shown.earliest_start}>
            <select
              id="ap-earliest"
              value={values.earliest_start}
              onChange={(e) => change('earliest_start', e.target.value)}
              className={inputClass(shown.earliest_start)}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="ap-deadline"
            label="Deadline (must be finished by)"
            error={shown.deadline}
            hint="A window may cross midnight, for example earliest 22:00 and deadline 07:00."
          >
            <select
              id="ap-deadline"
              value={values.deadline}
              onChange={(e) => change('deadline', e.target.value)}
              className={inputClass(shown.deadline)}
            >
              {[...HOURS, 24].map((h) => (
                <option key={h} value={h}>
                  {deadlineLabel(h)}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={values.interruptible}
              onChange={(e) => change('interruptible', e.target.checked)}
            />
            Interruptible (can run in separate hours, like an EV charger)
          </label>

          {windowWarning ? (
            <p className="text-xs font-medium text-amber-700 sm:col-span-2">{windowWarning}</p>
          ) : null}
        </div>
      )}

      {submitted && Object.keys(errors).length > 0 && (
        <p className="text-sm font-medium text-red-600">
          Please fix the highlighted fields before saving.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{initial ? 'Save changes' : 'Add appliance'}</Button>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

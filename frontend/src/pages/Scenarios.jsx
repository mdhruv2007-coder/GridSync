// Scenarios page: save the current setup, load the sample, list / load / delete saved scenarios.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useToast } from '../components/common/Toast';
import ScenarioList from '../components/scenarios/ScenarioList';
import { useScenario } from '../context/ScenarioContext';
import { listScenarios, createScenario, deleteScenario, seedScenario } from '../api/scenarios';
import { getErrorMessage } from '../api/client';

// Build the exact body POST /api/scenarios expects: { name, appliances[], tariff }.
// Fields are picked one by one so local ids are not sent to the backend.
function buildPayload(name, appliances, tariff) {
  return {
    name,
    appliances: appliances.map((a) => ({
      name: a.name,
      power_kw: a.power_kw,
      duration_h: a.duration_h,
      category: a.category,
      interruptible: a.interruptible,
      preferred_start: a.preferred_start,
      earliest_start: a.earliest_start ?? null,
      deadline: a.deadline ?? null,
    })),
    tariff: {
      base_rate: tariff.base_rate,
      max_load_kw: tariff.max_load_kw,
      slots: tariff.slots.map((s) => ({
        start_hour: s.start_hour,
        end_hour: s.end_hour,
        label: s.label,
        adjustment_pct: s.adjustment_pct,
      })),
    },
  };
}

export default function Scenarios() {
  const {
    appliances,
    tariff,
    scenarioId,
    scenarioName,
    loadScenario,
    applyScenario,
    setScenarioId,
    setScenarioName,
  } = useScenario();
  const { showToast } = useToast();

  const [name, setName] = useState(scenarioName || '');
  const [scenarios, setScenarios] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState(null); // scenario being loaded or deleted
  const [hint, setHint] = useState(''); // message shown with a link to the Dashboard

  // Fetch the saved list. Used on mount, after save/delete and by Retry.
  const refreshList = useCallback(async () => {
    try {
      const data = await listScenarios();
      setScenarios(data);
      setListError('');
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  function handleRetry() {
    setListLoading(true);
    setListError('');
    refreshList();
  }

  async function handleSave(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === '') {
      setSaveError('Please enter a name for the scenario.');
      return;
    }
    if (appliances.length === 0) {
      setSaveError('Add at least one appliance before saving.');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      const saved = await createScenario(buildPayload(trimmed, appliances, tariff));
      // Keep the current plan; just remember which saved scenario this is.
      setScenarioId(saved.id);
      setScenarioName(saved.name);
      setHint('Saved "' + saved.name + '".');
      showToast('Scenario saved.', 'success');
      await refreshList();
    } catch (err) {
      setSaveError(getErrorMessage(err));
      showToast('Could not save the scenario.', 'error');
    } finally {
      setSaving(false);
    }
  }

  // seedScenario is idempotent: it returns the existing Sample Household if present.
  async function handleSample() {
    setSeeding(true);
    try {
      const detail = await seedScenario();
      applyScenario(detail);
      setName(detail.name);
      setHint('Loaded "' + detail.name + '".');
      showToast('Sample Household loaded.', 'success');
      await refreshList();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSeeding(false);
    }
  }

  async function handleLoad(id) {
    setBusyId(id);
    const detail = await loadScenario(id);
    setBusyId(null);
    if (detail) {
      setName(detail.name);
      setHint('Loaded "' + detail.name + '".');
      showToast('Scenario loaded.', 'success');
    } else {
      showToast('Could not load the scenario. Is the backend running?', 'error');
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    try {
      await deleteScenario(id);
      if (id === scenarioId) {
        // The loaded scenario no longer exists in the database.
        setScenarioId(null);
        setScenarioName('');
      }
      showToast('Scenario deleted.', 'success');
      await refreshList();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const anyBusy = saving || seeding || busyId !== null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scenarios</h1>

      <Card title="Save current setup">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label htmlFor="scenario-name" className="mb-1 block text-sm font-medium text-slate-700">
              Scenario name
            </label>
            <input
              id="scenario-name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="For example: My flat"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <p className="text-xs text-slate-500">
            Saves {appliances.length} appliance(s) and the current tariff.
          </p>
          {saveError && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{saveError}</div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={anyBusy}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={handleSample} disabled={anyBusy}>
              {seeding ? 'Loading...' : 'Load Sample Household'}
            </Button>
          </div>
        </form>
      </Card>

      {hint && (
        <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {hint}{' '}
          <Link to="/" className="font-medium underline">
            Go to the Dashboard
          </Link>{' '}
          and click Optimise Schedule.
        </div>
      )}

      <Card title="Saved scenarios">
        {listLoading && <p className="text-sm text-slate-600">Loading saved scenarios...</p>}

        {!listLoading && listError && (
          <div className="space-y-3">
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{listError}</div>
            <Button variant="secondary" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}

        {!listLoading && !listError && scenarios.length === 0 && (
          <p className="text-sm text-slate-600">No saved scenarios yet.</p>
        )}

        {!listLoading && !listError && scenarios.length > 0 && (
          <ScenarioList
            scenarios={scenarios}
            currentId={scenarioId}
            onLoad={handleLoad}
            onDelete={handleDelete}
            busyId={anyBusy ? (busyId ?? -1) : null}
          />
        )}
      </Card>
    </div>
  );
}

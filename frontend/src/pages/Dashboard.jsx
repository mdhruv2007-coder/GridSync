// Dashboard: the demo screen. Summary cards, Optimise button, timeline, load curve.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useToast } from '../components/common/Toast';
import CostMeter from '../components/summary/CostMeter';
import SavingsCard from '../components/summary/SavingsCard';
import Timeline24h from '../components/timeline/Timeline24h';
import LoadCurve from '../components/charts/LoadCurve';
import { useScenario } from '../context/ScenarioContext';
import useOptimise from '../hooks/useOptimise';
import { getErrorMessage } from '../api/client';
import { formatPercent } from '../utils/format';
import { buildScheduleCsv, downloadCsv } from '../utils/exportCsv';

export default function Dashboard() {
  const { appliances, tariff, baseline, optimised, savings, warnings, loadSample } = useScenario();
  const { run, loading, error } = useOptimise();
  const { showToast } = useToast();
  const [hasRun, setHasRun] = useState(false); // true once Optimise worked on this page
  const [loadingSample, setLoadingSample] = useState(false);

  async function handleOptimise() {
    const data = await run();
    if (data) {
      setHasRun(true);
      showToast('Schedule optimised. Modelled saving ' + formatPercent(data.savings.percent) + '.', 'success');
    } else {
      showToast('Could not optimise the schedule.', 'error');
    }
  }

  // Build the CSV from the current (possibly dragged) optimised schedule and download it.
  function handleExport() {
    try {
      const csv = buildScheduleCsv(appliances, tariff, optimised);
      downloadCsv('gridsync_schedule.csv', csv);
      showToast('Schedule exported as gridsync_schedule.csv.', 'success');
    } catch (err) {
      const message = err && err.message ? err.message : 'Unknown error';
      showToast('Could not export the CSV: ' + message, 'error');
    }
  }

  async function handleLoadSample() {
    setLoadingSample(true);
    try {
      await loadSample();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoadingSample(false);
    }
  }

  // Empty state: nothing to schedule yet.
  if (appliances.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Card className="mt-4" title="No appliances yet">
          <p className="text-sm text-slate-600">
            Add your own appliances, or load the sample household to try GridSync quickly.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleLoadSample} disabled={loadingSample}>
              {loadingSample ? 'Loading...' : 'Load Sample Household'}
            </Button>
            <Link
              to="/appliances"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to Appliances
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const stale = optimised === null && hasRun;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Modelled estimates. Sample tariff.</p>
      </div>

      {/* Three summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <CostMeter
          label="Baseline cost per day"
          value={baseline ? baseline.total_cost : null}
          hint="At your usual start times"
          showProjection
        />
        <CostMeter
          label="Optimised cost per day"
          value={optimised ? optimised.total_cost : null}
          hint={optimised ? 'After moving flexible appliances' : 'Click Optimise Schedule'}
          tone="info"
          showProjection
        />
        <CostMeter
          label="Savings"
          kind="percent"
          value={savings ? savings.percent : null}
          hint={savings ? 'Modelled estimate' : 'Click Optimise Schedule'}
          tone="good"
        />
      </div>

      {/* Optimise and Export buttons, messages */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={handleOptimise} disabled={loading}>
            {loading ? 'Optimising...' : 'Optimise Schedule'}
          </Button>
          <Button variant="secondary" size="lg" onClick={handleExport} disabled={optimised === null}>
            Export CSV
          </Button>
          {optimised === null && <span className="text-sm text-slate-500">Optimise first</span>}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {stale && (
          <p className="mt-3 text-sm text-amber-800">
            You changed appliances or the tariff. Click Optimise Schedule again.
          </p>
        )}
        {!stale && !optimised && (
          <p className="mt-3 text-sm text-slate-600">Click Optimise Schedule to find cheaper hours.</p>
        )}
      </div>

      {/* Warnings from the optimiser */}
      {warnings && warnings.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <SavingsCard savings={savings} />

      <Card title="24-hour timeline">
        <Timeline24h />
      </Card>

      <Card title="Load curve: before versus after">
        <LoadCurve baseline={baseline} optimised={optimised} tariff={tariff} />
      </Card>
    </div>
  );
}

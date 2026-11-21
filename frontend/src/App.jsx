import { ScenarioProvider, useScenario } from './context/ScenarioContext'
import useOptimise from './hooks/useOptimise'
import { formatRs, formatPercent } from './utils/format'

// TEMPORARY screen to prove the foundation works. Stage 6 replaces this with routes.
function SmokeTest() {
  const { appliances, baseline, optimised, savings, warnings, loadSample, loading, error } = useScenario()
  const opt = useOptimise()

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-solar-dark">GridSync foundation check</h1>

      <div className="flex gap-3">
        <button onClick={loadSample} disabled={loading} className="rounded bg-solar px-4 py-2 text-white">
          Load Sample Household
        </button>
        <button onClick={opt.run} disabled={opt.loading} className="rounded bg-peak px-4 py-2 text-white">
          Optimise
        </button>
      </div>

      {(error || opt.error) && <p className="rounded bg-peak-light p-2 text-peak-dark">{error || opt.error}</p>}

      <ul className="rounded bg-white p-4 shadow">
        <li>Appliances loaded: {appliances.length}</li>
        <li>Baseline cost/day: {formatRs(baseline.total_cost)}</li>
        <li>Optimised cost/day: {optimised ? formatRs(optimised.total_cost) : '-'}</li>
        <li>Savings: {savings ? `${formatRs(savings.daily)} (${formatPercent(savings.percent)})` : '-'}</li>
        <li>Peak load (baseline): {baseline.peak_load} kW</li>
      </ul>

      {warnings.map((w) => (
        <p key={w} className="rounded bg-offpeak-light p-2 text-offpeak-dark">{w}</p>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <ScenarioProvider>
      <SmokeTest />
    </ScenarioProvider>
  )
}

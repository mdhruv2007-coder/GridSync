// SavingsCard: daily, monthly, yearly savings and percent from the optimiser.
// Everything here is a modelled estimate, not a real bill.
import Card from '../common/Card';
import { formatRs, formatPercent } from '../../utils/format';

function Figure({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function SavingsCard({ savings }) {
  const badge = (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      Modelled estimate
    </span>
  );

  return (
    <Card title="Savings" actions={badge}>
      {savings === null || savings === undefined ? (
        <p className="text-sm text-slate-500">
          No savings yet. Click Optimise Schedule to see the modelled savings.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Figure label="Daily" value={formatRs(savings.daily)} />
            <Figure label="Monthly" value={formatRs(savings.monthly)} />
            <Figure label="Yearly" value={formatRs(savings.yearly)} />
            <Figure label="Percent" value={formatPercent(savings.percent)} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Based on declared appliance ratings and the sample tariff. Not a real bill.
          </p>
        </>
      )}
    </Card>
  );
}

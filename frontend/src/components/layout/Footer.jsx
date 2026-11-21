// Footer.jsx - the three honesty statements. Shown on every page via Layout.
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 text-xs text-slate-600">
        <p>
          1. GridSync is a decision-support tool. It does not control appliances or read real meters.
        </p>
        <p>
          2. Tariff values are editable samples, not any utility's actual rates.
        </p>
        <p>
          3. All savings are modelled estimates from declared appliance ratings and hours.
        </p>
      </div>
    </footer>
  );
}

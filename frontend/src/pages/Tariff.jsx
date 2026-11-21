// Tariff.jsx - page wrapper. "Apply" stores the tariff in the context (local only).
import TariffEditor from '../components/tariff/TariffEditor';
import { useToast } from '../components/common/Toast';
import { useScenario } from '../context/ScenarioContext';

export default function Tariff() {
  const { tariff, setTariff } = useScenario();
  const { showToast } = useToast();

  function handleApply(newTariff) {
    setTariff(newTariff);
    showToast('Tariff applied. Run Optimise again to refresh the schedule.', 'success');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tariff</h1>
        <p className="text-sm text-slate-600">Sample values, edit them to match your own bill.</p>
      </div>
      <TariffEditor tariff={tariff} onApply={handleApply} />
    </div>
  );
}

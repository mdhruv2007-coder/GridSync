// ApplianceList.jsx - table of appliances with Edit and Delete buttons.
import Button from '../common/Button';
import { hourLabel, rangeLabel } from '../../utils/time';
import { formatKw } from '../../utils/format';

// Deadline 24 is shown as 24:00 so it is not confused with 00:00
function windowLabel(a) {
  const end = a.deadline === 24 ? '24:00' : hourLabel(a.deadline);
  return `${hourLabel(a.earliest_start)} - ${end}`;
}

export default function ApplianceList({ appliances, onEdit, onDelete }) {
  return (
    // overflow-x-auto: the table scrolls sideways on narrow screens
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="py-2 pr-3 font-semibold">Name</th>
            <th className="py-2 pr-3 font-semibold">Power</th>
            <th className="py-2 pr-3 font-semibold">Duration</th>
            <th className="py-2 pr-3 font-semibold">Category</th>
            <th className="py-2 pr-3 font-semibold">Usual time</th>
            <th className="py-2 pr-3 font-semibold">Window</th>
            <th className="py-2 pr-3 font-semibold">Interruptible</th>
            <th className="py-2 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appliances.map((a) => {
            const flexible = a.category === 'flexible';
            return (
              <tr key={a.id} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-medium">{a.name}</td>
                <td className="py-2 pr-3">{formatKw(a.power_kw)}</td>
                <td className="py-2 pr-3">{a.duration_h} h</td>
                <td className="py-2 pr-3">
                  {/* Category is written as text, not colour only */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      flexible ? 'bg-solar-light text-solar-dark' : 'bg-normal-light text-normal-dark'
                    }`}
                  >
                    {flexible ? 'Flexible' : 'Fixed'}
                  </span>
                </td>
                <td className="py-2 pr-3">{rangeLabel(a.preferred_start, a.duration_h)}</td>
                <td className="py-2 pr-3">{flexible ? windowLabel(a) : '-'}</td>
                <td className="py-2 pr-3">{flexible ? (a.interruptible ? 'Yes' : 'No') : '-'}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(a)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(a)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ScenarioList: shows saved scenarios with Load and Delete buttons.
// Delete asks for confirmation in a Modal. The loaded scenario shows the text "Loaded".
import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';

// created_at comes from the backend as an ISO string; show a short local date.
function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ScenarioList({ scenarios, currentId, onLoad, onDelete, busyId }) {
  const [pending, setPending] = useState(null); // scenario waiting for delete confirmation
  const locked = busyId !== null && busyId !== undefined; // a request is running

  function confirmDelete() {
    const target = pending;
    setPending(null);
    if (target) onDelete(target.id);
  }

  return (
    <div>
      <ul className="space-y-2">
        {scenarios.map((s) => {
          const isCurrent = s.id === currentId;
          const isBusy = s.id === busyId;
          return (
            <li
              key={s.id}
              className={
                'flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 ' +
                (isCurrent ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white')
              }
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {s.name}
                  {isCurrent && (
                    <span className="ml-2 rounded bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                      Loaded
                    </span>
                  )}
                </p>
                {formatDate(s.created_at) && (
                  <p className="text-xs text-slate-500">Saved on {formatDate(s.created_at)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onLoad(s.id)} disabled={locked}>
                  {isBusy ? 'Working...' : 'Load'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => setPending(s)} disabled={locked}>
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={pending !== null} title="Delete scenario?" onClose={() => setPending(null)}>
        <p className="text-sm text-slate-700">
          Delete {pending ? '"' + pending.name + '"' : 'this scenario'}? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

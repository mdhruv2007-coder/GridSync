// Appliances.jsx - page that edits the appliance list in the context (local only, nothing saved to DB).
import { useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import ApplianceForm from '../components/appliances/ApplianceForm';
import ApplianceList from '../components/appliances/ApplianceList';
import { useScenario } from '../context/ScenarioContext';

export default function Appliances() {
  const { appliances, addAppliance, updateAppliance, removeAppliance, loadSample, loading, error } =
    useScenario();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(null); // appliance being edited, or null = adding
  const [formKey, setFormKey] = useState(0); // changing the key resets the form
  const [deleteTarget, setDeleteTarget] = useState(null); // appliance waiting for delete confirm

  function handleSubmit(data) {
    if (editing) {
      updateAppliance(editing.id, { ...editing, ...data });
      showToast(`Updated "${data.name}".`, 'success');
      setEditing(null);
    } else {
      addAppliance(data);
      showToast(`Added "${data.name}".`, 'success');
    }
    setFormKey((k) => k + 1);
  }

  function confirmDelete() {
    removeAppliance(deleteTarget.id);
    if (editing && editing.id === deleteTarget.id) setEditing(null);
    showToast(`Deleted "${deleteTarget.name}".`, 'success');
    setDeleteTarget(null);
  }

  async function handleLoadSample() {
    const detail = await loadSample();
    if (detail) showToast('Sample Household loaded.', 'success');
    else showToast('Could not load the sample household.', 'error');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appliances</h1>

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card title={editing ? `Edit: ${editing.name}` : 'Add an appliance'}>
        <ApplianceForm
          key={editing ? `edit-${editing.id}` : `new-${formKey}`}
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </Card>

      <Card title={`Your appliances (${appliances.length})`}>
        {loading ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : appliances.length === 0 ? (
          <div className="py-6 text-center">
            <p className="mb-3 text-slate-600">
              No appliances yet. Add one above, or start with a ready-made example.
            </p>
            <Button onClick={handleLoadSample} disabled={loading}>
              Load Sample Household
            </Button>
          </div>
        ) : (
          <ApplianceList
            appliances={appliances}
            onEdit={setEditing}
            onDelete={setDeleteTarget}
          />
        )}
      </Card>

      <Modal open={deleteTarget !== null} title="Delete appliance?" onClose={() => setDeleteTarget(null)}>
        <p className="mb-4 text-sm text-slate-700">
          Delete <strong>{deleteTarget ? deleteTarget.name : ''}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
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

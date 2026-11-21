// Timeline24h: 24 hour grid, one row per appliance, drag and drop with @dnd-kit/core.
// It reads the scenario from context so the drop logic lives in one place.
import { DndContext, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import ApplianceBlock from './ApplianceBlock';
import { useScenario } from '../../context/ScenarioContext';
import { useToast } from '../common/Toast';
import {
  HOURS,
  hoursOf,
  canPlaceAt,
  hourLabel,
  rangeLabel,
  windowLength,
  isHourInWindow,
} from '../../utils/time';
import { computeResult, exceedsMaxLoad, baselineItems } from '../../utils/cost';
import { formatRs, formatKw, LABEL_STYLES } from '../../utils/format';

// Collision rule: the drop hour is the cell (in the SAME row) that is closest to
// the LEFT edge of the dragged block. So "block start lands on hour h" = start at h.
function startEdgeCollision({ active, collisionRect, droppableRects, droppableContainers }) {
  let best = null;
  let bestDist = Infinity;
  let cellWidth = 0;
  droppableContainers.forEach((container) => {
    const data = container.data.current;
    if (!data || data.applianceId !== active.id) return; // only this appliance's row
    const rect = droppableRects.get(container.id);
    if (!rect) return;
    const dist = Math.abs(rect.left - collisionRect.left);
    if (dist < bestDist) {
      best = container;
      bestDist = dist;
      cellWidth = rect.width;
    }
  });
  // Dragged too far outside the grid: no drop target, the block snaps back.
  if (!best || bestDist > cellWidth) return [];
  return [{ id: best.id, data: { droppableContainer: best, value: bestDist } }];
}

// One hour cell of a row. Flexible rows are droppable, fixed rows are not.
function HourCell({ appliance, hour, inWindow }) {
  const { setNodeRef, isOver } = useDroppable({
    id: appliance.id + ':' + hour,
    data: { applianceId: appliance.id, hour },
    disabled: appliance.category !== 'flexible',
  });
  let bg = '';
  if (isOver) bg = 'bg-indigo-200';
  else if (inWindow) bg = 'bg-indigo-50';
  return <div ref={setNodeRef} className={'flex-1 border-l border-slate-100 ' + bg} />;
}

// One appliance row: label column on the left, 24 cells and the block on the right.
function TimelineRow({ appliance, hours, dragEnabled, onMoveTo, onLockedClick }) {
  const flexible = appliance.category === 'flexible';
  return (
    <div className="flex items-stretch border-b border-slate-100">
      <div className="w-44 shrink-0 py-1 pr-2">
        <p className="truncate text-sm font-medium text-slate-800">{appliance.name}</p>
        <p className="text-xs text-slate-500">
          {formatKw(appliance.power_kw)} x {appliance.duration_h} h
        </p>
        {flexible ? (
          <p className="text-xs text-slate-500">
            Window {rangeLabel(appliance.earliest_start, windowLength(appliance.earliest_start, appliance.deadline))}
          </p>
        ) : (
          <p className="text-xs text-slate-500">Fixed (cannot move)</p>
        )}
        {/* Non-drag fallback: pick the start hour from a list */}
        {flexible && dragEnabled && (
          <select
            aria-label={'Move ' + appliance.name + ' to hour'}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
            value=""
            onChange={(e) => onMoveTo(appliance, Number(e.target.value))}
          >
            <option value="" disabled>
              Move to hour...
            </option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="relative flex min-h-[4.5rem] flex-1">
        {HOURS.map((h) => (
          <HourCell
            key={h}
            appliance={appliance}
            hour={h}
            inWindow={flexible && isHourInWindow(h, appliance.earliest_start, appliance.deadline)}
          />
        ))}
        <ApplianceBlock
          appliance={appliance}
          hours={hours}
          dragEnabled={dragEnabled}
          onLockedClick={onLockedClick}
        />
      </div>
    </div>
  );
}

export default function Timeline24h() {
  const { appliances, tariff, baseline, optimised, updateOptimisedItems } = useScenario();
  const { showToast } = useToast();

  // Small activation distance so a plain click is not treated as a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Drag is only possible after Optimise (we need the optimised plan to change).
  const dragEnabled = optimised !== null && optimised !== undefined;

  // Which items to draw: optimised plan, or the baseline before Optimise (read only).
  const baseItems = baseline && baseline.items && baseline.items.length > 0 ? baseline.items : baselineItems(appliances);
  const items = dragEnabled ? optimised.items : baseItems;

  // Try to start an appliance at a given hour (used by drag and by the select).
  // Simple rule: the whole block moves as ONE contiguous block starting at the
  // drop hour, also for the interruptible EV charger.
  function tryMove(appliance, hour) {
    if (!dragEnabled) {
      showToast('Click Optimise Schedule first.', 'info');
      return;
    }

    // Rule 1: the block must fit inside the allowed window.
    if (!canPlaceAt(appliance, hour)) {
      const win = rangeLabel(appliance.earliest_start, windowLength(appliance.earliest_start, appliance.deadline));
      showToast(appliance.name + ' must run inside its allowed window (' + win + ').', 'error');
      return;
    }

    // Build the candidate schedule: new hours for this appliance, copy the rest.
    const newHours = hoursOf(hour, appliance.duration_h);
    const current = optimised.items.find((it) => it.appliance_id === appliance.id);
    if (current && [...current.hours].sort().join() === [...newHours].sort().join()) return; // same place
    const newItems = optimised.items.map((it) =>
      it.appliance_id === appliance.id ? { ...it, hours: newHours } : it
    );

    // Rule 2: the new schedule must not exceed the max load in any hour.
    let result;
    try {
      result = computeResult(appliances, newItems, tariff);
    } catch (err) {
      showToast('Could not check that move.', 'error');
      return;
    }
    if (exceedsMaxLoad(result, tariff)) {
      showToast('That move would exceed the max load of ' + formatKw(tariff.max_load_kw) + '.', 'error');
      return;
    }

    // Accepted: update the context so cost meters and load curve change live.
    const oldCost = optimised.total_cost;
    updateOptimisedItems(newItems);
    const diff = result.total_cost - oldCost;
    showToast(
      'Moved ' + appliance.name + ' to ' + hourLabel(hour) + '. Daily cost ' + formatRs(result.total_cost) +
        ' (' + (diff <= 0 ? 'down ' : 'up ') + formatRs(Math.abs(diff)) + ').',
      'info'
    );
  }

  // dnd-kit calls this when the user releases the block.
  function handleDragEnd({ active, over }) {
    if (!over) return; // dropped outside the grid: nothing changes, block snaps back
    const appliance = appliances.find((a) => a.id === active.id);
    if (!appliance) return;
    tryMove(appliance, over.data.current.hour);
  }

  // Hour band header from the tariff slots (slot NAME is text).
  const slots = [...(tariff.slots || [])].sort((a, b) => a.start_hour - b.start_hour);

  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        {dragEnabled
          ? 'Drag a flexible block sideways to another hour, or use "Move to hour". Light purple cells are the allowed window.'
          : 'Showing your current (baseline) schedule, read only. Click Optimise Schedule to enable drag and drop.'}
      </p>

      <DndContext sensors={sensors} collisionDetection={startEdgeCollision} onDragEnd={handleDragEnd}>
        {/* Wrapper scrolls sideways on small screens */}
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Tariff band header */}
            <div className="flex">
              <div className="w-44 shrink-0 pr-2 text-xs font-medium text-slate-500">Tariff slot</div>
              <div className="flex flex-1">
                {slots.map((s, i) => {
                  const st = LABEL_STYLES[s.label] || {
                    name: s.label,
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  return (
                    <div
                      key={i}
                      style={{ width: ((s.end_hour - s.start_hour) / 24) * 100 + '%' }}
                      className={'truncate border-l px-1 py-1 text-center text-[11px] font-medium ' + st.bg + ' ' + st.text + ' ' + st.border}
                    >
                      {st.name}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hour numbers */}
            <div className="flex border-b border-slate-200">
              <div className="w-44 shrink-0 pr-2 text-xs font-medium text-slate-500">Hour</div>
              <div className="flex flex-1">
                {HOURS.map((h) => (
                  <div key={h} className="flex-1 py-1 text-center text-[10px] text-slate-500">
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* One row per appliance */}
            {appliances.map((a) => {
              const item = items.find((it) => it.appliance_id === a.id);
              return (
                <TimelineRow
                  key={a.id}
                  appliance={a}
                  hours={item ? item.hours : []}
                  dragEnabled={dragEnabled}
                  onMoveTo={tryMove}
                  onLockedClick={() =>
                    showToast(
                      a.category === 'fixed' ? a.name + ' is fixed and cannot be moved.' : 'Click Optimise Schedule first.',
                      'info'
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

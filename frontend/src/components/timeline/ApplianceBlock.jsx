// ApplianceBlock: ONE draggable appliance on the timeline.
// Its hours are drawn as one or more segments. A block that wraps past midnight
// (for example 22, 23, 0, 1) becomes TWO segments, but it is still ONE draggable.
import { useDraggable } from '@dnd-kit/core';
import { hourLabel } from '../../utils/time';

// Turn a list of hours into runs that never cross midnight.
// [22, 23, 0, 1] -> [{start: 0, len: 2}, {start: 22, len: 2}]
function toRuns(hours) {
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const runs = [];
  sorted.forEach((h) => {
    const last = runs[runs.length - 1];
    if (last && last.start + last.len === h) {
      last.len += 1;
    } else {
      runs.push({ start: h, len: 1 });
    }
  });
  return runs;
}

// The logical start hour: an hour whose previous hour (circular) is not in the list.
function findAnchor(hours) {
  const set = new Set(hours);
  const starts = [...set].filter((h) => !set.has((h + 23) % 24)).sort((a, b) => a - b);
  return starts.length > 0 ? starts[0] : Math.min(...set);
}

export default function ApplianceBlock({ appliance, hours, dragEnabled, onLockedClick }) {
  const isFixed = appliance.category === 'fixed';
  // Fixed appliances are never draggable. Flexible ones only after Optimise.
  const canDrag = !isFixed && dragEnabled;

  // dnd-kit: the block is a draggable whose id is the appliance id.
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appliance.id,
    disabled: !canDrag,
  });

  if (!hours || hours.length === 0) return null;

  const runs = toRuns(hours);
  const anchor = findAnchor(hours);

  // Move sideways only (y stays 0) while dragging. Both segments use the same offset.
  const moveStyle = transform ? 'translate3d(' + transform.x + 'px, 0px, 0)' : undefined;

  // Look of the block. Text is always shown, so colour is never the only signal.
  let look;
  if (isFixed) {
    look = 'border border-slate-400 bg-slate-300 text-slate-700 cursor-not-allowed';
  } else if (!dragEnabled) {
    look = 'border border-dashed border-indigo-500 bg-indigo-200 text-indigo-900 cursor-pointer';
  } else {
    look = 'bg-indigo-600 text-white shadow cursor-grab active:cursor-grabbing touch-none';
  }
  const stacking = isDragging ? 'z-30 opacity-90 ring-2 ring-indigo-300' : 'z-10';

  const title = appliance.name + ' (' + hours.length + ' h, starts ' + hourLabel(anchor) + ')';

  return (
    <>
      {runs.map((run) => {
        // Only the segment that holds the logical start is the dnd-kit node.
        // Its left edge is used to decide the drop hour.
        const isAnchor = run.start === anchor;
        return (
          <div
            key={run.start}
            ref={isAnchor ? setNodeRef : undefined}
            {...(canDrag ? listeners : {})}
            {...(isAnchor ? attributes : {})}
            onClick={canDrag ? undefined : onLockedClick}
            title={title}
            style={{
              left: (run.start / 24) * 100 + '%',
              width: (run.len / 24) * 100 + '%',
              transform: moveStyle,
            }}
            className={
              'absolute top-1 bottom-1 flex items-center overflow-hidden rounded px-1 text-[11px] font-medium ' +
              look +
              ' ' +
              stacking
            }
          >
            <span className="truncate">{isFixed ? 'Fixed' : appliance.name}</span>
          </div>
        );
      })}
    </>
  );
}

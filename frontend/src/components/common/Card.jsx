// Card.jsx - a white rounded panel with an optional title and an "actions" slot
// (actions = buttons shown at the right of the title bar).
export default function Card({ title, actions, className = '', children }) {
  return (
    <section className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

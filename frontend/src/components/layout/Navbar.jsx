// Navbar.jsx - brand, page links (active one highlighted) and the current scenario name.
import { NavLink } from 'react-router-dom';
import { useScenario } from '../../context/ScenarioContext';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true }, // end: "/" must match only the exact path
  { to: '/appliances', label: 'Appliances' },
  { to: '/tariff', label: 'Tariff' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/about', label: 'About' },
];

// NavLink gives us isActive, so we can style the current page differently
function linkClass({ isActive }) {
  return `rounded-xl border-[3px] border-slate-900 px-3 py-2 text-sm font-bold transition ${
    isActive
      ? 'bg-pink-400 shadow-[4px_4px_0_0_#0f172a]'
      : 'bg-white hover:bg-yellow-200'
  }`;
}
export default function Navbar() {
  const { scenarioName } = useScenario();

  return (
    <header className="border-b border-slate-200 bg-white">
      {/* flex-wrap makes the links drop to a second row on small screens */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="text-xl font-bold text-indigo-700">GridSync</span>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        {scenarioName ? (
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            Scenario: <strong>{scenarioName}</strong>
          </span>
        ) : null}
      </div>
    </header>
  );
}

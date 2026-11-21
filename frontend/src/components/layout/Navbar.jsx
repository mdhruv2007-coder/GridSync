// Navbar.jsx - brand, page links (active one highlighted) and the current scenario name.
import { NavLink } from 'react-router-dom';
import { useScenario } from '../../context/ScenarioContext';

// IMPORTANT: if the `to` paths in your old file were different, copy them over.
const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/appliances', label: 'Appliances' },
  { to: '/tariff', label: 'Tariff' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/about', label: 'About' },
];

// NavLink gives us isActive, so we can style the current page differently
function linkClass({ isActive }) {
  return isActive ? 'nb-link nb-link-on' : 'nb-link';
}

export default function Navbar() {
  const { scenarioName } = useScenario();

  return (
    <header className="nb-nav">
      <span className="nb-dots" aria-hidden="true">
        <i style={{ background: '#E8412F' }} />
        <i style={{ background: '#FFD23F' }} />
        <i style={{ background: '#2EC4A0' }} />
      </span>
      <span className="nb-brand">GRIDSYNC</span>
      {LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
          {l.label}
        </NavLink>
      ))}
      {scenarioName ? <span className="nb-scenario">Scenario: {scenarioName}</span> : null}
    </header>
  );
}

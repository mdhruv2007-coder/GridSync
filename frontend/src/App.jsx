// App.jsx - providers + routes. BrowserRouter is already in main.jsx.
import { Link, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { ScenarioProvider } from './context/ScenarioContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Appliances from './pages/Appliances';
import Tariff from './pages/Tariff';
import Scenarios from './pages/Scenarios';
import About from './pages/About';

// Shown for any URL that matches no route
function NotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <p className="mb-4 text-slate-600">That page does not exist.</p>
      <Link to="/" className="font-medium text-indigo-600 underline">
        Go to the Dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ScenarioProvider>
        <Routes>
          {/* Layout route: every child page is drawn inside Layout's <Outlet /> */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/appliances" element={<Appliances />} />
            <Route path="/tariff" element={<Tariff />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ScenarioProvider>
    </ToastProvider>
  );
}

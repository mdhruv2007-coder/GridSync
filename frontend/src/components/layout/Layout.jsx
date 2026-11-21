// Layout.jsx - the frame around every page: navbar, ticker, current page, footer.
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { Globe, Sun, Cat, Burst } from './Mascots';

const TICKER = '★ Save watts ★ Save rupees ★ Beat the peak ★ Geyser ready by 7 AM ';

// A small sticker in the top-right corner, chosen by the current route.
function Sticker() {
  const path = useLocation().pathname.toLowerCase();
  if (path.includes('appliance')) return <Cat size={110} />;
  if (path.includes('tariff')) return <Sun size={110} />;
  if (path.includes('scenario')) return <Burst size={110} label="SAVE" fill="#FFD23F" />;
  return <Globe size={110} />;
}

export default function Layout() {
  return (
    <div className="nb-frame">
      <Navbar />
      <div className="nb-ticker" aria-hidden="true">
        <div className="nb-ticker-track">
          <span>{TICKER.repeat(4)}</span>
          <span>{TICKER.repeat(4)}</span>
        </div>
      </div>
      <main className="relative mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-7 sm:py-8">
        {/* decoration sits behind the page and is hidden on small screens */}
        <div className="nb-sticker hidden lg:block" aria-hidden="true">
          <Sticker />
        </div>
        {/* Outlet = where the current page (Dashboard, Appliances, ...) is drawn */}
        <div className="nb-content">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

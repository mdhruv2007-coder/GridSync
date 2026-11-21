// Layout.jsx - Navbar on top, page content in the middle, Footer at the bottom.
// flex-col + min-h-screen + flex-1 on <main> pushes the footer down on short pages.
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-amber-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {/* Outlet = where the current page (Dashboard, Appliances, ...) is drawn */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

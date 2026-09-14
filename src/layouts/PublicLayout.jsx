import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

/**
 * ANCHOR: PublicLayout
 * Renders shared layout (Navbar, main container, Footer) for public pages that do not require authentication.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}



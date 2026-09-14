import { useEffect, useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

/**
 * ANCHOR: AdminLayout
 * Protects admin pages by requiring a token, and renders shared layout for admin area.
 */
const adminNavItems = [
  { to: '/admin', label: 'Dasbor' },
  { to: '/admin/attractions', label: 'Kelola Objek Wisata' },
  { to: '/admin/hotels', label: 'Kelola Hotel' },
  { to: '/admin/restorans', label: 'Kelola Restoran' },
  { to: '/admin/categories', label: 'Kelola Kategori' },
  { to: '/admin/events', label: 'Kelola Event' },
  { to: '/admin/reviews', label: 'Kelola Ulasan' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sessionStatus, setSessionStatus] = useState('loading');
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    let active = true;

    api.get('/admin/session')
      .then((response) => {
        if (!active) return;
        setAdmin(response.data.user);
        setSessionStatus('authenticated');
      })
      .catch(() => {
        if (!active) return;
        setAdmin(null);
        setSessionStatus('unauthenticated');
      });

    return () => {
      active = false;
    };
  }, []);

  /**
   * ANCHOR: handleLogout
   * Clears auth token and redirects to admin login page.
   */
  async function handleLogout() {
    try {
      await api.post('/admin/logout');
    } finally {
      setAdmin(null);
      setSessionStatus('unauthenticated');
      navigate('/admin/login', { replace: true });
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg" aria-label="Memeriksa sesi admin" />
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  const linkClass = ({ isActive }) => `justify-start ${isActive ? 'font-semibold' : ''}`;

  return (
    <div className="min-h-screen flex bg-base-100">
      <aside className="w-64 bg-base-200 border-r hidden md:flex flex-col">
        <div className="p-4 border-b">
          <div className="text-lg font-bold">Admin Panel</div>
        </div>
        <ul className="menu p-2 flex-1">
          {adminNavItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>{item.label}</NavLink>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-3">
            <div className="avatar w-10 h-10">
              <img
                src="https://placehold.co/200x200?text=A"
                alt="Admin"
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-base-content truncate">
                {admin?.username || 'Administrator'}
              </p>
            </div>
          </div>
          <button 
            className="btn btn-error btn-sm w-full gap-2" 
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="navbar bg-base-100 border-b">
          <div className="flex-1 px-4">
            <span className="font-semibold">Dashboard Admin</span>
          </div>
          <div className="flex-none px-4 md:hidden">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <img
                  src="https://placehold.co/200x200?text=A"
                  alt="Admin"
                  className="w-5 rounded-full object-cover"
                />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span className="text-xs">{admin?.username || 'Administrator'}</span>
                </li>
                <li>
                  <button 
                    className="text-error gap-2" 
                    onClick={handleLogout}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


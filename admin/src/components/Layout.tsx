import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/companies', label: 'Companies' },
  { to: '/points', label: 'Points' },
  { to: '/instructions', label: 'Instructions' },
  { to: '/questions', label: 'Questions' },
  { to: '/reports', label: 'Reports' },
  { to: '/tariffs', label: 'Tariffs' },
  { to: '/chats', label: 'Chats' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.name ?? user?.email ?? 'A').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Admin</h1>
            <p className="text-sm text-slate-500">Operations console</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {initial}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.name ?? user?.username ?? 'Admin'}</div>
              <div className="text-slate-500">{user?.roleId === 1 ? 'Super Admin' : 'Admin'}</div>
            </div>
            <button
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

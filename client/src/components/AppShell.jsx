import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { HeartbeatDot, PageTransition } from './Motion.jsx';

const NAV_ITEMS = [
  { to: '/browse', label: 'Browse', icon: '📡' },
  { to: '/connections', label: 'Connections', icon: '🔗' },
  { to: '/rooms', label: 'Rooms', icon: '👥' },
  { to: '/library', label: 'Library', icon: '📚' },
  { to: '/profile', label: 'Profile', icon: '◎' },
];

export default function AppShell({ children }) {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function toggleAvailability() {
    const next = user.availabilityStatus === 'open' ? 'busy' : 'open';
    await api('PATCH', '/users/me/availability', { status: next });
    setUser({ ...user, availabilityStatus: next });
  }

  const canBeMentor = user && ['mentor', 'both'].includes(user.role);
  const items = user?.isAdmin ? [...NAV_ITEMS, { to: '/admin', label: 'Admin', icon: '🛡' }] : NAV_ITEMS;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop / tablet top bar */}
      <div className="sticky top-0 z-50 hidden items-center justify-between border-b border-border bg-bg/85 px-7 py-3.5 backdrop-blur-md sm:flex">
        <div className="flex items-center gap-2.5 font-display text-xl font-bold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-wave-ping rounded-full bg-signal opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal" />
          </span>
          Signal
        </div>
        <div className="flex items-center gap-1">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm transition-colors ${isActive ? 'bg-surface text-signal' : 'text-text-muted hover:bg-surface hover:text-text'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {canBeMentor && (
            <button
              onClick={toggleAvailability}
              className={`ml-2 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                user.availabilityStatus === 'open'
                  ? 'border-receive/40 text-receive'
                  : 'border-border text-text-faint'
              }`}
            >
              {user.availabilityStatus === 'open'
                ? <HeartbeatDot color="var(--color-receive)" size={7} />
                : <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />}
              {user.availabilityStatus === 'open' ? 'Open to mentees' : 'Busy'}
            </button>
          )}
          <button className="ml-1 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:text-text" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      {/* Mobile top bar: brand + availability only */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-wave-ping rounded-full bg-signal opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          Signal
        </div>
        <div className="flex items-center gap-2">
          {canBeMentor && (
            <button onClick={toggleAvailability} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${user.availabilityStatus === 'open' ? 'border-receive/40 text-receive' : 'border-border text-text-faint'}`}>
              {user.availabilityStatus === 'open' ? <HeartbeatDot color="var(--color-receive)" size={6} /> : <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />}
              {user.availabilityStatus === 'open' ? 'Open' : 'Busy'}
            </button>
          )}
          <button className="text-xs text-text-muted" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-20 sm:pt-8">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-bg-elevated/95 py-2 backdrop-blur-md sm:hidden">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] ${isActive ? 'text-signal' : 'text-text-muted'}`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

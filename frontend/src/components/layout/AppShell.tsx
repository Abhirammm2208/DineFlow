import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FiGrid,
  FiShoppingBag,
  FiUsers,
  FiBarChart2,
  FiHeart,
  FiSpeaker,
  FiSettings,
  FiSearch,
  FiBell,
  FiWifi,
  FiLogOut,
} from 'react-icons/fi';
import { useStore } from '../../store/store.js';
import api from '../../services/api.js';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/pos', label: 'POS Billing', icon: FiShoppingBag },
  { to: '/customers', label: 'Customers', icon: FiUsers },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/loyalty', label: 'Loyalty', icon: FiHeart },
  { to: '/campaigns', label: 'Campaigns', icon: FiSpeaker },
];

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useStore((s) => s.token);
  const merchantName = useStore((s) => s.merchantName);
  const clearAuth = useStore((s) => s.clearAuth);
  const [live, setLive] = useState<number | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const isCustomers = location.pathname.startsWith('/customers');
  const searchPlaceholder = isCustomers
    ? 'Search customers…'
    : 'Search orders, customers, items…';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const { data } = await api.getLiveRevenue();
        if (!cancelled) setLive(data.liveRevenue ?? 0);
      } catch {
        if (!cancelled) setLive(null);
      }
    };
    poll();
    const id = setInterval(poll, 12000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  const runSearch = async () => {
    if (!searchQ.trim()) return;
    try {
      const data = await api.globalSearch(searchQ.trim());
      const first = data.customers?.[0];
      if (first?.id) {
        navigate(`/customers?highlight=${first.id}`);
      } else {
        navigate(`/customers?q=${encodeURIComponent(searchQ.trim())}`);
      }
      setSearchOpen(false);
    } catch {
      navigate(`/customers?q=${encodeURIComponent(searchQ.trim())}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const initials = (merchantName || 'M').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen df-page-bg text-slate-900 overflow-hidden font-sans antialiased">
      <aside className="w-[248px] shrink-0 bg-white border-r border-[var(--df-border)] flex flex-col py-6 px-3">
        <div className="px-2 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center text-base shrink-0 shadow-sm">
              <span aria-hidden className="translate-y-px">
                🍴
              </span>
            </div>
            <div>
              <div className="font-bold text-[17px] text-slate-900 leading-tight tracking-tight">DineFlow</div>
              <div className="text-[11px] text-slate-500 font-medium tracking-wide">Restaurant Edition</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] transition-colors ${
                  isActive
                    ? 'df-nav-active'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`
              }
            >
              <Icon className="text-[18px] shrink-0 opacity-90" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14px] font-medium mb-2 ${
                isActive ? 'df-nav-active' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <FiSettings className="text-[18px]" />
            Settings
          </NavLink>
          <div className="px-2 pt-2 flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ring-white shadow"
              title={merchantName || ''}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-slate-800 truncate">{merchantName || 'Merchant'}</div>
              <div className="text-[10px] text-slate-400 truncate">Admin</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex items-center gap-2 text-[12px] text-slate-500 hover:text-red-600 w-full px-3 py-1.5 rounded-lg hover:bg-red-50/50"
          >
            <FiLogOut className="text-sm" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[var(--df-bg)]">
        <header className="h-[60px] shrink-0 bg-white border-b border-[var(--df-border)] flex items-center justify-between gap-4 px-6">
          {/* Left — search */}
          <div className="flex-1 min-w-0 max-w-xl relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[14px]" />
            <input
              className="df-search-global w-full pl-10 pr-4 h-9 text-[13px] text-slate-800 placeholder:text-slate-400 border-0 focus:ring-2 focus:ring-teal-300/60 focus:outline-none transition-shadow rounded-lg bg-slate-50"
              placeholder={searchPlaceholder}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            {searchOpen && searchQ.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30">
                <button
                  type="button"
                  className="w-full text-left text-[13px] px-4 py-2.5 hover:bg-slate-50 text-slate-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={runSearch}
                >
                  Search for &quot;{searchQ}&quot;
                </button>
              </div>
            )}
          </div>

          {/* Right — live pill + actions + avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {live != null && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full df-pill-live text-[12px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--df-live)] shadow-[0_0_0_3px_rgba(34,197,94,0.25)]" />
                {isCustomers ? 'Today' : 'Live'}: ₹{fmtMoney(live)}
              </div>
            )}
            <button type="button" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500" aria-label="Notifications">
              <FiBell className="text-[17px]" />
            </button>
            <span className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400" aria-hidden>
              <FiWifi className="text-[17px]" />
            </span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-slate-100 shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

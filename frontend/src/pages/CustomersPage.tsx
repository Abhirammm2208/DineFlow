import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import { FiPlus, FiSend, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { Alert, Input, Button } from '../components/index';

type Row = {
  id: string;
  name: string;
  phone: string;
  total_spend: number;
  total_visits: number;
  aov: number;
  crm_status: string;
  points_balance?: number;
  updated_at?: string;
};

const SEGMENTS = [
  { id: 'all', label: 'All Customers' },
  { id: 'vip', label: 'VIP' },
  { id: 'high_spenders', label: 'High Spenders' },
  { id: 'frequent', label: 'Frequent' },
  { id: 'at_risk', label: 'At Risk' },
  { id: 'new', label: 'New' },
];

function initials(name: string) {
  const p = name.split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}

function inferStatus(c: any): string {
  const spend = Number(c.total_spend || 0);
  const visits = Number(c.total_visits || 0);
  
  if (spend >= 25000) return 'vip';
  if (visits <= 1) return 'new';
  if (spend <= 150 && visits >= 2) return 'at_risk';
  return 'active';
}

function badgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'vip') return 'bg-emerald-100 text-emerald-800';
  if (s === 'at_risk') return 'bg-rose-100 text-rose-800';
  if (s === 'new') return 'bg-violet-100 text-violet-800';
  return 'bg-sky-100 text-sky-800';
}

function lastVisitLabel(iso?: string) {
  if (!iso) return 'Last: —';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'Last: Today';
  if (days === 1) return 'Last: 1 day ago';
  return `Last: ${days} days ago`;
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const token = useStore((s) => s.token);
  const [segment, setSegment] = useState('all');
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [appliedQ, setAppliedQ] = useState(params.get('q') || '');
  const [selectedId, setSelectedId] = useState<string | null>(params.get('highlight'));
  const [detail, setDetail] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const qFromUrl = useMemo(() => params.get('q') || '', [params]);
  const highlightFromUrl = useMemo(() => params.get('highlight'), [params]);

  useEffect(() => {
    setAppliedQ((prev) => (prev === qFromUrl ? prev : qFromUrl));
  }, [qFromUrl]);

  useEffect(() => {
    if (highlightFromUrl) setSelectedId(highlightFromUrl);
  }, [highlightFromUrl]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.getCustomersPaged({
        segment: segment === 'all' ? undefined : segment,
        page,
        limit: 8,
        q: appliedQ.trim() || undefined,
      });
      const customers = response.data?.customers || [];
      const total = response.data?.total || 0;
      setRows(customers);
      setTotal(total);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, segment, page, appliedQ]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    load();
  }, [token, navigate, load]);

  useEffect(() => {
    // Reset to page 1 when segment changes
    setPage(1);
  }, [segment]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    (async () => {
      try {
        const [c, a, t] = await Promise.all([
          api.getCustomer(selectedId),
          api.getCustomerActivity(selectedId),
          api.getCustomerTopItems(selectedId),
        ]);
        setDetail(c.data);
        setActivity(a.data.activity || []);
        setTopItems(t.data.topItems || []);
      } catch {
        setDetail(null);
      }
    })();
  }, [selectedId]);

  const newCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setNotification({ type: 'error', message: 'Name and phone are required' });
      return;
    }
    setCreatingCustomer(true);
    try {
      await api.createCustomer(newCustName, newCustPhone, newCustEmail || undefined);
      setNotification({ type: 'success', message: 'Customer created successfully!' });
      setShowNewCustomerForm(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      load();
    } catch (err: any) {
      setNotification({ 
        type: 'error', 
        message: err?.response?.data?.error || 'Failed to create customer' 
      });
    } finally {
      setCreatingCustomer(false);
    }
  };

  const openRow = (id: string) => {
    setSelectedId(id);
    const next = new URLSearchParams(params);
    next.set('highlight', id);
    setParams(next, { replace: true });
  };

  const closePanel = () => {
    setSelectedId(null);
    const next = new URLSearchParams(params);
    next.delete('highlight');
    setParams(next, { replace: true });
  };

  if (!token) return null;

  const fmt = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tierLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'vip') return 'VIP Member';
    return `${(status || 'Member').replace(/^\w/, (c) => c.toUpperCase())}`;
  };

  const panelContent = selectedId && detail && (
        <div className="p-6 xl:sticky xl:top-0">
          <div className="flex justify-end xl:hidden mb-2">
            <button type="button" onClick={closePanel} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
              <FiX className="text-lg" />
            </button>
          </div>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-[88px] h-[88px] rounded-full bg-emerald-500 text-white text-2xl font-bold flex items-center justify-center mb-4 shadow-md">
              {initials(detail.name)}
            </div>
            <h2 className="text-[18px] font-bold text-slate-900">{detail.name}</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">{detail.email || '—'}</p>
            <p className="text-[13px] text-slate-600 mt-1">{detail.phone}</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wide">
                {tierLabel(inferStatus(detail))}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                {(detail.points_balance ?? 0).toLocaleString()} points
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="df-card p-4 !shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Lifetime Value</div>
              <div className="text-[20px] font-bold text-slate-900 mt-1">{fmt(Number(detail.total_spend || 0))}</div>
            </div>
            <div className="df-card p-4 !shadow-sm">
              <div className="text-[11px] text-slate-500 font-medium">Avg Order</div>
              <div className="text-[20px] font-bold text-slate-900 mt-1">{fmt(Number(detail.aov || 0))}</div>
            </div>
          </div>

          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Top ordered items</h3>
          <ul className="space-y-2 mb-6">
            {topItems.length === 0 ? (
              <li className="text-[12px] text-slate-400">No history yet</li>
            ) : (
              topItems.map((it) => (
                <li
                  key={it.name}
                  className="flex justify-between items-center text-[13px] border border-slate-100 rounded-[12px] px-3 py-2.5 bg-slate-50/50"
                >
                  <span className="font-medium text-slate-800">{it.name}</span>
                  <span className="text-slate-400 text-[12px]">{it.count}×</span>
                </li>
              ))
            )}
          </ul>

          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Recent activity</h3>
          <div className="space-y-5 border-l-2 border-teal-200 pl-4 ml-1.5">
            {activity.length === 0 ? (
              <p className="text-[12px] text-slate-400">No completed orders yet.</p>
            ) : (
              activity.map((ev) => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-100" />
                  <div className="text-[11px] text-slate-400">
                    {new Date(ev.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                  <div className="text-[13px] font-semibold text-slate-900 capitalize mt-0.5">{ev.type}</div>
                  <div className="text-[11px] text-slate-500">{ev.detail}</div>
                  <div className="text-[13px] font-bold text-slate-900 mt-1">
                    {fmt(ev.amount)}
                    <span className="text-emerald-600 font-semibold text-[11px] ml-2">Earned {ev.pointsEarned} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 space-y-2.5">
            <button
              type="button"
              className="w-full py-3 rounded-[12px] border border-slate-200 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center justify-center gap-2"
              onClick={() => api.sendCustomerMessage(selectedId, 'Thanks for dining with us!')}
            >
              <FiSend /> Send Message
            </button>
            <button
              type="button"
              className="w-full py-3 rounded-[12px] bg-black text-white text-[13px] font-semibold hover:bg-slate-900"
              onClick={() => alert('Notes editor can connect to your CRM backend.')}
            >
              Add Note
            </button>
          </div>
        </div>
  );

  return (
    <div className="flex flex-col xl:flex-row min-h-0 h-full relative">
      {notification && (
        <Alert 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Customer</h2>
            <div className="space-y-4">
              <Input
                label="Customer Name"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="e.g., Priya Sharma"
              />
              <Input
                label="Phone Number"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="e.g., +91 90000 10001"
              />
              <Input
                label="Email (optional)"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewCustomerForm(false);
                    setNewCustName('');
                    setNewCustPhone('');
                    setNewCustEmail('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={newCustomer}
                  isLoading={creatingCustomer}
                >
                  Add Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity xl:hidden ${
          selectedId && detail ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!selectedId}
        onClick={closePanel}
      />
      <div className="flex-1 min-w-0 px-6 sm:px-8 py-8 overflow-auto xl:pr-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6 max-w-[920px]">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Customer CRM</h1>
            <p className="text-slate-500 text-[14px] mt-1.5 max-w-xl">
              Manage relationships, track spending, and drive retention.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCustomerForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-black text-white text-[13px] font-semibold hover:bg-slate-900 shadow-sm shrink-0 h-fit"
          >
            <FiPlus className="text-base" /> New Customer
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSegment(s.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                segment === s.id
                  ? 'text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
              style={
                segment === s.id
                  ? { background: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', color: '#042f2e' }
                  : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="text-[12px] text-slate-400 mb-3">Use the header search to filter this list.</p>

        <div className="df-card overflow-hidden max-w-[920px]">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50/90 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Total Spend</th>
                  <th className="px-5 py-3.5">Visits</th>
                  <th className="px-5 py-3.5">AOV</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No customers match this view.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => openRow(r.id)}
                      className={`cursor-pointer transition-colors hover:bg-teal-50/50 ${
                        selectedId === r.id ? 'bg-teal-50/80' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-900 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {initials(r.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{r.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{lastVisitLabel(r.updated_at)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{r.phone}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{fmt(Number(r.total_spend || 0))}</td>
                      <td className="px-5 py-3.5 text-slate-700">{r.total_visits ?? 0}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{fmt(Number(r.aov || 0))}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeClass(inferStatus(r))}`}>
                          {inferStatus(r).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
            <span>
              Showing {(page - 1) * 8 + 1}-{Math.min(page * 8, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                disabled={page * 8 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedId && (
        <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[400px] bg-white border-l border-[var(--df-border)] shadow-2xl overflow-y-auto xl:static xl:z-0 xl:max-w-none xl:w-[380px] xl:shrink-0 xl:shadow-none xl:min-h-[calc(100dvh-56px)]">
          {detail ? (
            panelContent
          ) : (
            <div className="p-6 text-center py-20 text-slate-400">
              <div className="animate-pulse">Loading customer details...</div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

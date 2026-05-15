import { useEffect, useState } from 'react';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import {
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiRepeat,
  FiShoppingBag,
  FiDollarSign,
  FiAward,
  FiInfo,
  FiEdit2,
  FiX,
} from 'react-icons/fi';

type DashStats = {
  todayRevenue: number;
  todayRevenueChangePct: number;
  billsToday: number;
  pendingBills: number;
  returningCustomersPct: number;
  returningCustomersChangePct: number;
  avgOrderValue: number;
  avgOrderValueChangePct: number;
};

type TopCustomer = {
  id: string;
  name: string;
  phone: string;
  total_visits: number;
  total_spend: number;
  points_balance: number;
};

type AtRiskCustomer = {
  id: string;
  name: string;
  last_visit_at?: string;
};

function initials(name: string) {
  const p = name.split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}

export function DashboardPage() {
  const token = useStore((s) => s.token);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [topByVisits, setTopByVisits] = useState<TopCustomer[]>([]);
  const [topBySpend, setTopBySpend] = useState<TopCustomer[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskCustomer[]>([]);
  const [leaderTab, setLeaderTab] = useState<'visits' | 'spend'>('visits');
  const [showWinBackEditModal, setShowWinBackEditModal] = useState(false);
  const [winBackSubject, setWinBackSubject] = useState('');
  const [winBackBody, setWinBackBody] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const demoStats: DashStats = {
    todayRevenue: 2480.5,
    todayRevenueChangePct: 12.5,
    billsToday: 42,
    pendingBills: 4,
    returningCustomersPct: 38,
    returningCustomersChangePct: 21.5,
    avgOrderValue: 59,
    avgOrderValueChangePct: -12.1,
  };

  useEffect(() => {
    if (!token) {
      setStats(demoStats);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [statsRes, topRes, riskRes, profileRes] = await Promise.all([
          api.getDashboardStats(),
          api.getTopCustomers(),
          api.getAtRisk(),
          api.getMerchantProfile(),
        ]);
        setStats(statsRes.data);
        setTopByVisits(topRes.data.byVisits || []);
        setTopBySpend(topRes.data.bySpend || []);
        setAtRisk(riskRes.data.customers || []);
        // Load saved winback template from profile
        const profile = profileRes.data;
        setWinBackSubject(profile.winback_subject || '');
        setWinBackBody(profile.winback_body || '');
      } catch {
        setStats(demoStats);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const exportCsv = async () => {
    if (!token) { alert('Sign in to export data.'); return; }
    try {
      const { data } = await api.exportDashboard();
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = data.filename || 'export.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };


  const fmtMoney = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const TrendUp = ({ v, suffix }: { v: number; suffix: string }) => (
    <span className="text-emerald-600 inline-flex items-center gap-1 text-[12px] font-semibold">
      <FiTrendingUp className="text-[14px]" />+{Math.abs(v).toFixed(1)}% {suffix}
    </span>
  );
  const TrendDown = ({ v, suffix }: { v: number; suffix: string }) => (
    <span className="text-rose-600 inline-flex items-center gap-1 text-[12px] font-semibold">
      <FiTrendingDown className="text-[14px]" />{Math.abs(v).toFixed(1)}% {suffix}
    </span>
  );

  const leaderList = leaderTab === 'visits' ? topByVisits : topBySpend;
  const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-[14px] mt-1">Today&apos;s performance at a glance.</p>
        </div>
        <button type="button" onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-black text-white text-[13px] font-semibold hover:bg-slate-900 shadow-sm shrink-0">
          <FiDownload /> Export CSV
        </button>
      </div>

      {/* Automated Win-Back Banner */}
      {!loading && atRisk.length > 0 && (
        <div className="mb-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <FiInfo className="text-blue-500 text-xl mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 text-[14px]">
                {atRisk.length} customer{atRisk.length > 1 ? 's' : ''} haven&apos;t visited in 30+ days
              </p>
              <p className="text-blue-700 text-[12px] mt-0.5">
                Win-back messages are automatically sent daily at 10 AM to inactive customers with points.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWinBackEditModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 text-[11px] font-semibold hover:bg-blue-50 transition"
              title="Customize win-back message"
            >
              <FiEdit2 className="text-[11px]" /> Edit Message
            </button>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-[11px] font-semibold">
              🤖 Automated Daily
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading metrics…</div>
      ) : (
        <>
      {/* Win-Back Message Edit Modal */}
      {showWinBackEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Customize Win-Back Message</h2>
              <button onClick={() => setShowWinBackEditModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <FiX className="text-lg text-slate-500" />
              </button>
            </div>
            <p className="text-[13px] text-slate-500 mb-4">
              Edit the default message below. Variables: {'{name}'}, {'{merchant}'}, {'{points}'}, {'{discountPct}'}, {'{days}'}
            </p>

            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Subject</label>
            <input
              type="text"
              value={winBackSubject || "We miss you at {merchant}! Your {points} points are waiting"}
              onChange={e => setWinBackSubject(e.target.value === "We miss you at {merchant}! Your {points} points are waiting" ? '' : e.target.value)}
              placeholder="Email subject..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none mb-4"
            />
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Message Body</label>
            <textarea
              value={winBackBody || "Hey {name}! We noticed you haven't visited {merchant} in {days} days — we miss you!\n\n🎁 You have {points} reward points waiting! That's worth a {discountPct}% discount on your next visit. We have exciting offers at the restaurant — visit for more details!\n\nWe can't wait to serve you again! Hurry up and claim your rewards before they expire. 🔥"}
              onChange={e => {
                const defaultBody = "Hey {name}! We noticed you haven't visited {merchant} in {days} days — we miss you!\n\n🎁 You have {points} reward points waiting! That's worth a {discountPct}% discount on your next visit. We have exciting offers at the restaurant — visit for more details!\n\nWe can't wait to serve you again! Hurry up and claim your rewards before they expire. 🔥";
                setWinBackBody(e.target.value === defaultBody ? '' : e.target.value);
              }}
              rows={7}
              placeholder="Write your win-back message..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none mb-5"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setWinBackSubject('');
                  setWinBackBody('');
                  localStorage.removeItem('winback_subject');
                  localStorage.removeItem('winback_body');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Reset to Default
              </button>
              <button
                onClick={async () => {
                  setSavingTemplate(true);
                  try {
                    await api.updateMerchantProfile({ winback_subject: winBackSubject, winback_body: winBackBody });
                    setShowWinBackEditModal(false);
                  } catch {
                    alert('Failed to save template');
                  } finally {
                    setSavingTemplate(false);
                  }
                }}
                disabled={savingTemplate}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingTemplate ? 'Saving…' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Stat Cards */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div className="df-card p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today&apos;s Revenue</span>
                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><FiDollarSign className="text-lg" /></span>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{fmtMoney(stats?.todayRevenue ?? 0)}</div>
              <div className="mt-3">
                {(stats?.todayRevenueChangePct ?? 0) >= 0
                  ? <TrendUp v={stats?.todayRevenueChangePct ?? 0} suffix="vs yesterday" />
                  : <TrendDown v={stats?.todayRevenueChangePct ?? 0} suffix="vs yesterday" />}
              </div>
            </div>

            <div className="df-card p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bills Today</span>
                <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><FiFileText className="text-lg" /></span>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{stats?.billsToday ?? 0}</div>
              <p className="text-[13px] text-slate-500 mt-3">
                <span className="font-semibold text-amber-600">{stats?.pendingBills ?? 0}</span> pending
              </p>
            </div>

            <div className="df-card p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Returning Cust.</span>
                <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center"><FiRepeat className="text-lg" /></span>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{(stats?.returningCustomersPct ?? 0).toFixed(1)}%</div>
              <div className="mt-3">
                {(stats?.returningCustomersChangePct ?? 0) >= 0
                  ? <TrendUp v={stats?.returningCustomersChangePct ?? 0} suffix="vs last week" />
                  : <TrendDown v={stats?.returningCustomersChangePct ?? 0} suffix="vs last week" />}
              </div>
            </div>

            <div className="df-card p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Order Value</span>
                <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><FiShoppingBag className="text-lg" /></span>
              </div>
              <div className="text-[28px] font-bold text-slate-900 tracking-tight">{fmtMoney(stats?.avgOrderValue ?? 0)}</div>
              <div className="mt-3">
                {(stats?.avgOrderValueChangePct ?? 0) >= 0
                  ? <TrendUp v={stats?.avgOrderValueChangePct ?? 0} suffix="vs yesterday" />
                  : <TrendDown v={stats?.avgOrderValueChangePct ?? 0} suffix="vs yesterday" />}
              </div>
            </div>
          </div>

          {/* Top Customers Leaderboard */}
          {leaderList.length > 0 && (
            <div className="df-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FiAward className="text-amber-500 text-lg" />
                  <h2 className="text-[15px] font-bold text-slate-900">Top Customers</h2>
                </div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[12px] font-semibold">
                  <button
                    onClick={() => setLeaderTab('visits')}
                    className={`px-3 py-1.5 transition ${leaderTab === 'visits' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    By Visits
                  </button>
                  <button
                    onClick={() => setLeaderTab('spend')}
                    className={`px-3 py-1.5 transition ${leaderTab === 'spend' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    By Spend
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {leaderList.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`text-lg w-6 text-center ${medalColors[i] ?? 'text-slate-300'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-bold text-slate-600 shrink-0">
                      {initials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400">{c.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {leaderTab === 'visits' ? (
                        <>
                          <p className="text-[13px] font-bold text-slate-900">{c.total_visits} visits</p>
                          <p className="text-[11px] text-slate-400">{fmtMoney(c.total_spend)} spent</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] font-bold text-slate-900">{fmtMoney(c.total_spend)}</p>
                          <p className="text-[11px] text-slate-400">{c.total_visits} visits</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

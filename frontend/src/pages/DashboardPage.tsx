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
  FiAlertTriangle,
  FiSend,
  FiAward,
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
  const [winBackSending, setWinBackSending] = useState(false);
  const [winBackDone, setWinBackDone] = useState(false);
  const [leaderTab, setLeaderTab] = useState<'visits' | 'spend'>('visits');
  const [showWinBackModal, setShowWinBackModal] = useState(false);
  const [winBackSubject, setWinBackSubject] = useState('We Miss You! Come Back for a Special Treat');
  const [winBackBody, setWinBackBody] = useState('Hey! It\'s been a while since your last visit. We\'ve been saving your table — come back and enjoy a welcome-back treat exclusively for you. Can\'t wait to see you again!');

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
        const [statsRes, topRes, riskRes] = await Promise.all([
          api.getDashboardStats(),
          api.getTopCustomers(),
          api.getAtRisk(),
        ]);
        setStats(statsRes.data);
        setTopByVisits(topRes.data.byVisits || []);
        setTopBySpend(topRes.data.bySpend || []);
        setAtRisk(riskRes.data.customers || []);
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

  const openWinBackModal = () => setShowWinBackModal(true);

  const sendWinBack = async () => {
    if (!winBackSubject.trim() || !winBackBody.trim()) return;
    setWinBackSending(true);
    try {
      await api.createCampaign(winBackSubject.trim(), winBackBody.trim(), 'active', undefined, 'at_risk');
      const campaigns = await api.getCampaigns();
      const camp = (campaigns.data.campaigns || []).find((c: any) => c.title === winBackSubject.trim() && !c.sent_at);
      if (camp?.id) await api.broadcastCampaign(camp.id);
      setWinBackDone(true);
      setShowWinBackModal(false);
    } catch { alert('Win-back send failed'); }
    finally { setWinBackSending(false); }
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

      {/* Win-Back Banner */}
      {!loading && atRisk.length > 0 && !winBackDone && (
        <div className="mb-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-amber-500 text-xl mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-[14px]">
                {atRisk.length} customer{atRisk.length > 1 ? 's' : ''} haven&apos;t visited in 30+ days
              </p>
              <p className="text-amber-700 text-[12px] mt-0.5">
                Send them a personalised win-back message right now — one click.
              </p>
            </div>
          </div>
          <button
            onClick={openWinBackModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 shrink-0 transition"
          >
            <FiSend className="text-[13px]" />
            Win Back {atRisk.length} Customers
          </button>
        </div>
      )}
      {winBackDone && (
        <div className="mb-7 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-emerald-800 text-[13px] font-semibold">
          ✅ Win-back messages sent to {atRisk.length} customers!
        </div>
      )}

      {/* Win-Back Campaign Modal */}
      {showWinBackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Compose Win-Back Campaign</h2>
              <button onClick={() => setShowWinBackModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <FiX className="text-lg text-slate-500" />
              </button>
            </div>

            <p className="text-[13px] text-slate-500 mb-4">
              This message will be emailed to <span className="font-semibold text-slate-700">{atRisk.length} at-risk customer{atRisk.length > 1 ? 's' : ''}</span> who haven&apos;t visited recently.
            </p>

            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Subject</label>
            <input
              type="text"
              value={winBackSubject}
              onChange={e => setWinBackSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none mb-4"
              placeholder="Email subject line..."
            />

            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Message Body</label>
            <textarea
              value={winBackBody}
              onChange={e => setWinBackBody(e.target.value)}
              rows={5}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none mb-5"
              placeholder="Write your win-back message..."
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowWinBackModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={sendWinBack}
                disabled={winBackSending || !winBackSubject.trim() || !winBackBody.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 disabled:opacity-50 transition"
              >
                <FiSend className="text-[13px]" />
                {winBackSending ? 'Sending...' : `Send to ${atRisk.length} Customers`}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading metrics…</div>
      ) : (
        <>
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

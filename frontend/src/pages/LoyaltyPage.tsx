import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import { FiPlus } from 'react-icons/fi';
import { Alert, Input, Button } from '../components/index';

export function LoyaltyPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const [stats, setStats] = useState<any>(null);
  const [tiers, setTiers] = useState<any>(null);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [ref, setRef] = useState<any>(null);
  const [cash, setCash] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const [s, t, st, r, c, camp] = await Promise.all([
          api.getLoyaltyStats(),
          api.getLoyaltyTiers(),
          api.getLoyaltyStreaks(),
          api.getLoyaltyReferrals(),
          api.getLoyaltyCashback(),
          api.getCampaigns(),
        ]);
        setStats(s.data);
        setTiers(t.data);
        setStreaks(st.data.streaks || []);
        setRef(r.data);
        setCash(c.data);
        setCampaigns(camp.data.campaigns || []);
      } catch {
        /* ignore */
      }
    })();
  }, [token, navigate]);

  if (!token) return null;

  const barColors: Record<string, string> = {
    platinum: 'bg-slate-900',
    gold: 'bg-amber-400',
    silver: 'bg-slate-300',
    bronze: 'bg-orange-400',
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto space-y-8">
      {notification && (
        <Alert 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      {showCampaignForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create Campaign</h2>
            <div className="space-y-4">
              <Input
                label="Campaign Title"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g., Summer Special Promo"
              />
              <Input
                label="Description"
                value={campaignDesc}
                onChange={(e) => setCampaignDesc(e.target.value)}
                placeholder="Optional campaign description"
              />
              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCampaignForm(false);
                    setCampaignTitle('');
                    setCampaignDesc('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!campaignTitle.trim()) {
                      setNotification({ type: 'error', message: 'Please enter campaign title' });
                      return;
                    }
                    setCreating(true);
                    try {
                      await api.createCampaign(campaignTitle, campaignDesc || 'Created from dashboard', 'active');
                      const { data } = await api.getCampaigns();
                      setCampaigns(data.campaigns || []);
                      setNotification({ type: 'success', message: 'Campaign created successfully!' });
                      setShowCampaignForm(false);
                      setCampaignTitle('');
                      setCampaignDesc('');
                    } catch (err: any) {
                      setNotification({ 
                        type: 'error', 
                        message: err?.response?.data?.error || 'Failed to create campaign' 
                      });
                    } finally {
                      setCreating(false);
                    }
                  }}
                  isLoading={creating}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loyalty &amp; Retention</h1>
          <p className="text-slate-500 text-[14px] mt-1.5 max-w-2xl">
            Manage your customer rewards, tiers, and automated engagement campaigns.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
          onClick={() => setShowCampaignForm(true)}
        >
          <FiPlus /> Create Campaign
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-900">Program performance</h2>
            <span className="text-xs text-slate-500 border rounded-lg px-2 py-1">Last 30 days</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-xs text-slate-500">Active members</div>
              <div className="text-2xl font-bold">{stats?.activeMembers?.toLocaleString() ?? '—'}</div>
              <div className="text-xs text-emerald-600 font-semibold">+{stats?.activeMembersChangePct}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Points redeemed</div>
              <div className="text-2xl font-bold">{stats?.pointsRedeemed?.toLocaleString() ?? '—'}</div>
              <div className="text-xs text-emerald-600 font-semibold">+{stats?.pointsRedeemedChangePct}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Loyalty revenue</div>
              <div className="text-2xl font-bold">${stats?.loyaltyRevenue?.toLocaleString() ?? '—'}</div>
              <div className="text-xs text-emerald-600 font-semibold">+{stats?.loyaltyRevenueChangePct}%</div>
            </div>
          </div>
          <div className="flex items-end gap-1 sm:gap-2 h-40 border-t border-slate-100 pt-4">
            {(stats?.chart || []).map((d: any, i: number) => {
              const max = Math.max(
                1,
                ...(stats?.chart || []).map((x: any) => Math.max(x.revenue, x.redemptions))
              );
              const h1 = (d.revenue / max) * 100;
              const h2 = (d.redemptions / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end justify-center gap-0.5 min-h-[100px]">
                    <div className="w-2 sm:w-3 rounded-t bg-teal-500 transition-all" style={{ height: `${Math.max(8, h1)}%` }} />
                    <div className="w-2 sm:w-3 rounded-t bg-slate-300 transition-all" style={{ height: `${Math.max(8, h2)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" /> Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" /> Redemptions
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Tier distribution</h2>
          <div className="space-y-3">
            {(tiers?.distribution || []).map((row: any) => (
              <div key={row.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize font-medium">{row.label}</span>
                  <span className="text-slate-500">
                    {row.pct}% · {row.members}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColors[row.id] || 'bg-teal-500'}`}
                    style={{ width: `${Math.min(100, row.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
            Manage tier rules
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-900 text-[17px]">Active campaigns</h2>
          <button type="button" className="text-[13px] font-semibold text-teal-700 hover:text-teal-800">
            View All
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {campaigns.map((c: any) => (
            <div key={c.id || c.title} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-2xl">📣</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {c.status}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>
              <div className="flex gap-4 mt-3 text-xs">
                <div>
                  <div className="text-slate-400">{c.stat_primary_label}</div>
                  <div className="font-bold text-slate-800">{c.stat_primary_value}</div>
                </div>
                <div>
                  <div className="text-slate-400">{c.stat_secondary_label}</div>
                  <div className="font-bold text-slate-800">{c.stat_secondary_value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm md:col-span-2">
          <h3 className="font-bold text-slate-900 mb-3">Top streaks</h3>
          <ul className="space-y-2">
            {streaks.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between text-sm border border-slate-50 rounded-xl px-3 py-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-amber-700 font-semibold">{s.streak} 🔥</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="text-xs text-slate-500">Referrals</div>
            <div className="text-2xl font-bold">{ref?.referralsCount ?? '—'}</div>
            <div className="text-xs text-emerald-600">+{ref?.changePct}%</div>
            <p className="text-xs text-slate-500 mt-2">{ref?.newSignupsPct}% new signups via referrals</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="text-xs text-slate-500">Cashback pool</div>
            <div className="text-lg font-bold">
              ${cash?.current?.toLocaleString()} / ${cash?.cap?.toLocaleString()}
            </div>
            <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cash?.utilizedPct ?? 0}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">{cash?.utilizedPct}% utilized</p>
          </div>
        </div>
      </div>
    </div>
  );
}

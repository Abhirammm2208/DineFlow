import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { FiTrendingUp, FiFileText, FiUsers } from 'react-icons/fi';

type ChartDay = { date: string; revenue: number; bills: number };

const fmtRupee = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg text-[12px]">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-emerald-600 font-bold">{fmtRupee(payload[0]?.value ?? 0)}</p>
      <p className="text-slate-400">{payload[0]?.payload?.bills} bills</p>
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const [summary, setSummary] = useState<any>(null);
  const [chart, setChart] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    (async () => {
      try {
        const [sumRes, chartRes] = await Promise.all([
          api.getAnalyticsSummary(),
          api.getRevenueChart(),
        ]);
        setSummary(sumRes.data);
        setChart(chartRes.data.chart || []);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  if (!token) return null;

  const maxRevenue = chart.length ? Math.max(...chart.map((d) => d.revenue)) : 1;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
      <p className="text-slate-500 text-sm mt-1">Trailing 30-day snapshot · 7-day daily breakdown</p>

      {loading ? (
        <div className="text-slate-400 text-sm mt-10">Loading analytics…</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-7 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FiTrendingUp className="text-xl" />
              </span>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">30-day Revenue</div>
                <div className="text-[22px] font-bold text-slate-900 mt-0.5">{fmtRupee(summary?.revenue ?? 0)}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <FiFileText className="text-xl" />
              </span>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Bills Completed</div>
                <div className="text-[22px] font-bold text-slate-900 mt-0.5">{summary?.completedBills ?? '—'}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <FiUsers className="text-xl" />
              </span>
              <div>
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Customers</div>
                <div className="text-[22px] font-bold text-slate-900 mt-0.5">{summary?.customers ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* 7-Day Revenue Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Daily Revenue</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Last 7 days</p>
              </div>
              <span className="text-[12px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {fmtRupee(chart.reduce((s, d) => s + d.revenue, 0))} total
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chart} barSize={36} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}
                  onMouseEnter={(_, idx) => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {chart.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.revenue === maxRevenue ? '#10b981' : hoveredIdx === idx ? '#6366f1' : '#e2e8f0'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Best day highlighted in green · Hover for details
            </p>
          </div>
        </>
      )}
    </div>
  );
}

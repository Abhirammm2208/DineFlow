import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import { FiPlus, FiSend, FiZap, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { Alert, Input, Button } from '../components/index';

const SEGMENTS = [
  { id: 'all', label: 'All Customers' },
  { id: 'vip', label: 'VIP (10+ visits)' },
  { id: 'frequent', label: 'Frequent (5+ visits)' },
  { id: 'high_spenders', label: 'High Spenders (₹5k+)' },
  { id: 'at_risk', label: 'At Risk (30+ days away)' },
];

function statusBadge(status: string) {
  switch (status) {
    case 'active':   return 'bg-emerald-100 text-emerald-800';
    case 'scheduled':return 'bg-amber-100 text-amber-800';
    case 'draft':    return 'bg-slate-100 text-slate-600';
    case 'sent':     return 'bg-blue-100 text-blue-800';
    default:         return 'bg-slate-100 text-slate-600';
  }
}

function fmtSent(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function CampaignsPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const [list, setList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [segment, setSegment] = useState('all');
  const [creating, setCreating] = useState(false);
  const [broadcasting, setBroadcasting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSegment, setEditSegment] = useState('all');
  const [editStatus, setEditStatus] = useState('active');
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

  const reload = () => api.getCampaigns().then((r) => setList(r.data.campaigns || []));

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    reload();
  }, [token, navigate]);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!token) return null;

  const handleCreate = async () => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Campaign title is required' });
      return;
    }
    setCreating(true);
    try {
      await api.createCampaign(title, desc || '', 'active', undefined, segment);
      await reload();
      setNotification({ type: 'success', message: 'Campaign created!' });
      setShowForm(false);
      setTitle(''); setDesc(''); setSegment('all');
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.response?.data?.error || 'Failed to create campaign' });
    } finally {
      setCreating(false);
    }
  };

  const handleBroadcast = async (id: string, campaignTitle: string) => {
    if (!window.confirm(`Send "${campaignTitle}" to all matching customers now?`)) return;
    setBroadcasting(id);
    try {
      const { data } = await api.broadcastCampaign(id);
      await reload();
      setNotification({ type: 'success', message: `Broadcast complete — ${data.sent} sent, ${data.failed} failed` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.response?.data?.error || 'Broadcast failed' });
    } finally {
      setBroadcasting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.deleteCampaign(id);
      await reload();
      setNotification({ type: 'success', message: 'Campaign deleted successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.response?.data?.error || 'Failed to delete campaign' });
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (campaign: any) => {
    setEditing(campaign);
    setEditTitle(campaign.title || '');
    setEditDesc(campaign.description || '');
    setEditSegment(campaign.target_segment || 'all');
    setEditStatus(campaign.status || 'active');
  };

  const handleUpdate = async () => {
    if (!editing?.id) return;
    if (!editTitle.trim()) {
      setNotification({ type: 'error', message: 'Campaign title is required' });
      return;
    }
    try {
      await api.updateCampaign(editing.id, {
        title: editTitle,
        description: editDesc,
        status: editStatus,
        target_segment: editSegment,
      });
      await reload();
      setNotification({ type: 'success', message: 'Campaign updated!' });
      setEditing(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.response?.data?.error || 'Failed to update campaign' });
    }
  };

  const handleDeleteFromModal = async () => {
    if (!editing?.id) return;
    await handleDelete(editing.id);
    setEditing(null);
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      {notification && (
        <Alert type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900">Edit Campaign</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <FiX className="text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Campaign Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Monsoon Special Offer"
              />
              <Input
                label="Description"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="What's the offer? (shown in notification)"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Segment</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  value={editSegment}
                  onChange={(e) => setEditSegment(e.target.value)}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDeleteFromModal}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                >
                  Delete
                </button>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-5">New Campaign</h2>
            <div className="space-y-4">
              <Input
                label="Campaign Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Monsoon Special Offer"
              />
              <Input
                label="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What's the offer? (shown in notification)"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Segment</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-sm"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                >
                  {SEGMENTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => { setShowForm(false); setTitle(''); setDesc(''); setSegment('all'); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} isLoading={creating}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">Manage go-to-market experiments and promotional campaigns.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
        >
          <FiPlus /> New Campaign
        </button>
      </div>

      <ul className="space-y-3">
        {list.map((c) => (
          <li key={c.id || c.title} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">{c.title}</div>
              {c.description && <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>}
              <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                {c.target_segment && c.target_segment !== 'all' && (
                  <span className="inline-flex items-center gap-1">
                    👥 {SEGMENTS.find(s => s.id === c.target_segment)?.label || c.target_segment}
                  </span>
                )}
                {c.sent_at && (
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    <FiSend className="text-[11px]" /> Sent {fmtSent(c.sent_at)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-full ${statusBadge(c.status)}`}>
                {c.status}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(c)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  title="Edit campaign"
                >
                  <FiEdit2 className="text-[11px]" /> Edit
                </button>
                {/* Delete moved into edit modal per design */}
                {c.id && !c.id.startsWith('seed-') && (() => {
                  const sentMs = c.sent_at ? new Date(c.sent_at).getTime() : 0;
                  const elapsed = now - sentMs;
                  const onCooldown = sentMs > 0 && elapsed < COOLDOWN_MS;
                  const secsLeft = onCooldown ? Math.ceil((COOLDOWN_MS - elapsed) / 1000) : 0;
                  const minsLeft = Math.floor(secsLeft / 60);
                  const sLeft = secsLeft % 60;
                  return (
                    <button
                      onClick={() => !onCooldown && handleBroadcast(c.id, c.title)}
                      disabled={broadcasting === c.id || onCooldown}
                      title={onCooldown ? `Available again in ${minsLeft}m ${sLeft}s` : 'Send to customers now'}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                        onCooldown
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
                      }`}
                    >
                      <FiZap className="text-[11px]" />
                      {broadcasting === c.id
                        ? 'Sending…'
                        : onCooldown
                        ? `${minsLeft}m ${sLeft}s`
                        : 'Send Now'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-center text-slate-400 text-sm py-12">No campaigns yet. Create your first one!</li>
        )}
      </ul>
    </div>
  );
}

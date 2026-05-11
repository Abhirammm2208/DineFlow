import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';
import { useStore } from '../store/store.js';
import api from '../services/api.js';
import { Alert, Button, Input } from '../components/index';

export function SettingsPage() {
  const navigate = useNavigate();
  const token = useStore((s) => s.token);
  const merchantName = useStore((s) => s.merchantName);
  const setTaxRate = useStore((s) => s.setTaxRate);
  const setPointsRate = useStore((s) => s.setPointsRate);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    tax_rate_percent: '8.5',
    points_rate: '5',
    receipt_template: 'standard',
    staff_roles: 'admin,manager,cashier',
  });

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        const { data } = await api.getMerchantProfile();
        if (!mounted) return;

        // Convert decimal tax_rate from DB to percentage for display
        const taxRateDecimal = Number(data.tax_rate ?? 0.085);
        const taxRatePercent = (taxRateDecimal * 100).toFixed(2).replace(/\.?0+$/, '');

        setProfile({
          name: data.name || '',
          phone: data.phone || '',
          tax_rate_percent: taxRatePercent,
          points_rate: String(data.points_rate ?? 5),
          receipt_template: data.receipt_template || 'standard',
          staff_roles: Array.isArray(data.staff_roles)
            ? data.staff_roles.join(',')
            : 'admin,manager,cashier',
        });

        // Sync to store
        setTaxRate(taxRateDecimal);
        setPointsRate(Number(data.points_rate ?? 5));
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.error || 'Could not load merchant settings');
      } finally {
        if (mounted) setProfileLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, setTaxRate, setPointsRate]);

  if (!token) {
    navigate('/login');
    return null;
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(null);

    // Convert percentage to decimal for storage
    const taxRatePercent = Number(profile.tax_rate_percent) || 0;
    const taxRateDecimal = taxRatePercent / 100;
    const pointsRate = Number(profile.points_rate) || 5;

    if (taxRatePercent < 0 || taxRatePercent > 100) {
      setError('Tax rate must be between 0% and 100%');
      setLoading(false);
      return;
    }

    if (pointsRate < 0 || pointsRate > 100) {
      setError('Points rate must be between 0% and 100%');
      setLoading(false);
      return;
    }

    try {
      await api.updateMerchantProfile({
        name: profile.name,
        phone: profile.phone,
        tax_rate: taxRateDecimal,
        receipt_template: profile.receipt_template,
        points_rate: pointsRate,
        staff_roles: profile.staff_roles
          .split(',')
          .map((role) => role.trim())
          .filter(Boolean),
      });

      // Update store so POS page immediately reflects changes
      setTaxRate(taxRateDecimal);
      setPointsRate(pointsRate);
      setSaved('Settings saved successfully! Changes will reflect across all pages.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save merchant settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="text-slate-500 text-sm mt-1">Workspace preferences for {merchantName}.</p>
      <div className="mt-8 space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {saved && <Alert type="success" message={saved} onClose={() => setSaved(null)} />}
      </div>

      {profileLoading ? (
        <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm text-center text-slate-500">
          Loading settings…
        </div>
      ) : (
        <form onSubmit={saveProfile} className="mt-8 bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Merchant Profile</h2>
            <p className="text-sm text-slate-500 mt-1">Configure tax, loyalty points, receipts, and staff access.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Merchant Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={profile.tax_rate_percent}
              onChange={(e) => setProfile({ ...profile, tax_rate_percent: e.target.value })}
              helperText="Enter as percentage, e.g. 8.5 for 8.5% tax. This will be applied to all bills."
            />
            <Input
              label="Loyalty Points Rate (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={profile.points_rate}
              onChange={(e) => setProfile({ ...profile, points_rate: e.target.value })}
              helperText="Percentage of bill amount awarded as points, e.g. 5 means ₹100 bill earns 5 points."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Receipt Template"
              value={profile.receipt_template}
              onChange={(e) => setProfile({ ...profile, receipt_template: e.target.value })}
              helperText="Examples: standard, compact, kitchen, premium."
            />
            <Input
              label="Staff Roles"
              value={profile.staff_roles}
              onChange={(e) => setProfile({ ...profile, staff_roles: e.target.value })}
              helperText="Comma-separated roles supported by the merchant account."
            />
          </div>

          {/* Live preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Preview</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Tax on ₹1000 bill:</span>
                <span className="font-bold text-slate-900 ml-2">
                  ₹{((Number(profile.tax_rate_percent) || 0) / 100 * 1000).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Total with tax:</span>
                <span className="font-bold text-slate-900 ml-2">
                  ₹{(1000 + (Number(profile.tax_rate_percent) || 0) / 100 * 1000).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Points earned:</span>
                <span className="font-bold text-emerald-700 ml-2">
                  {Math.floor((1000 + (Number(profile.tax_rate_percent) || 0) / 100 * 1000) * (Number(profile.points_rate) || 0) / 100)} pts
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-400 max-w-xl">
              Run <code className="bg-slate-100 px-1 rounded">backend/supabase-migration-v2.sql</code> in Supabase for full POS metadata
              such as customer CRM and campaign tables.
            </p>
            <Button type="submit" variant="primary" isLoading={loading} className="inline-flex items-center gap-2">
              <FiSave /> Save Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

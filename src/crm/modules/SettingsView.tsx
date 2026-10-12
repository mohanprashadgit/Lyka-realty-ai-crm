/**
 * SettingsView.tsx — System Settings & Organization Configuration
 * Real MySQL crm_settings • Real PATCH /api/crm/settings persistence
 * RBAC Restricted (Super Admin, Admin)
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Settings,
  RefreshCw,
  Building,
  Sliders,
  DollarSign,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [hotScore, setHotScore] = useState(80);
  const [warmScore, setWarmScore] = useState(50);

  const fetchSettings = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/settings', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied: Settings are restricted to Super Admin and Operations Admin.');
            setSettings({});
          });
        }
        return res.json().then(d => {
          if (d.success && d.settings) {
            setSettings(d.settings);
            if (d.settings.organization) {
              setOrgName(d.settings.organization.name || 'Lyka Realty Global');
              setHeadquarters(d.settings.organization.headquarters || 'Chennai, Tamil Nadu');
              setSupportEmail(d.settings.organization.supportEmail || 'contact@lykarealty.com');
            }
            if (d.settings.lead_scoring) {
              setHotScore(d.settings.lead_scoring.hotMinScore || 80);
              setWarmScore(d.settings.lead_scoring.warmMinScore || 50);
            }
          }
        });
      })
      .catch(err => console.error('[SettingsView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, [activeRole]);

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/crm/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': activeRole },
        body: JSON.stringify({
          setting_key: 'organization',
          setting_value: {
            name: orgName,
            headquarters,
            supportEmail,
            defaultCurrency: 'INR',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[SettingsView] Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (forbiddenError) {
    return (
      <div className="py-20 text-center rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 max-w-xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Access Denied</h3>
        <p className="text-xs text-[#968a7e] mt-2">{forbiddenError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
            <span>System Settings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              Admin Governance
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Organization identity, lead qualification thresholds, and supported currency units
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
              : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
          }`}
          title="Refresh Settings"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>System configuration successfully updated and saved to MySQL.</span>
        </div>
      )}

      {/* ─── Settings Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Organization Profile */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="flex items-center gap-3 pb-4 border-b border-[#28232D] mb-4">
            <Building className="w-5 h-5 text-[#d8a868]" />
            <div>
              <h3 className="font-bold text-sm text-white">Organization Identity</h3>
              <p className="text-xs text-[#968a7e]">Global brokerage entity metadata</p>
            </div>
          </div>

          <form onSubmit={handleSaveOrganization} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Company Name</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Headquarters</label>
              <input
                type="text"
                value={headquarters}
                onChange={e => setHeadquarters(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                }`}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-xs font-bold transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Organization Details'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Lead Scoring & Thresholds */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="flex items-center gap-3 pb-4 border-b border-[#28232D] mb-4">
            <Sliders className="w-5 h-5 text-[#d8a868]" />
            <div>
              <h3 className="font-bold text-sm text-white">Lead Qualification Rules</h3>
              <p className="text-xs text-[#968a7e]">Deterministic scoring thresholds</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-[#28232D] bg-[#18161B]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">HOT Lead Threshold</span>
                <span className="font-mono text-sm font-bold text-rose-400">Score ≥ {hotScore}%</span>
              </div>
              <p className="text-[#968a7e] mt-1">Requires immediate agent follow-up within 15 minutes.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#28232D] bg-[#18161B]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">WARM Lead Threshold</span>
                <span className="font-mono text-sm font-bold text-amber-400">Score ≥ {warmScore}%</span>
              </div>
              <p className="text-[#968a7e] mt-1">Requires follow-up within 24 hours.</p>
            </div>

            <div className="pt-4 border-t border-[#28232D]">
              <h4 className="font-bold text-white mb-2">Supported Currencies & Measurement Units</h4>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['INR (₹)', 'AED (د.إ)', 'USD ($)', 'GBP (£)', 'EUR (€)', 'SGD (S$)'].map(c => (
                  <span key={c} className="px-2.5 py-1 rounded-lg bg-[#28232D] text-white font-mono text-[11px]">
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['sqft', 'cents', 'acres', 'grounds', 'sqm'].map(u => (
                  <span key={u} className="px-2.5 py-1 rounded-lg bg-[#28232D] text-[#d8a868] font-mono text-[11px]">
                    {u}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

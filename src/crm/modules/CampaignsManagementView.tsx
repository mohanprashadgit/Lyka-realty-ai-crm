/**
 * CampaignsManagementView.tsx — Growth & Digital Marketing Campaigns
 * Real MySQL campaigns • RBAC Restricted (Super Admin, Admin, Marketing Executive)
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Megaphone,
  Search,
  RefreshCw,
  TrendingUp,
  Target,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const CampaignsManagementView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/campaigns', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied: Only Super Admin, Admin, or Marketing Executive can access campaigns.');
            setCampaigns([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setCampaigns(d.data || []);
        });
      })
      .catch(err => console.error('[CampaignsView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeRole]);

  const filtered = campaigns.filter(c => {
    return (
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.source_channel?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const formatPrice = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget || 0), 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + Number(c.leads_generated || 0), 0);

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
            <span>Marketing Campaigns</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {campaigns.length} Campaigns
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Digital ad channels (Meta, Google, Portals), acquisition spend, and lead attribution
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Campaigns"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Total Ad Spend</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-[#d8a868]">{formatPrice(totalBudget)}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Leads Generated</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">{totalLeads}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Average CPL</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-sky-400">
            {totalLeads > 0 ? formatPrice(Math.round(totalBudget / totalLeads)) : '₹0'}
          </div>
        </div>
      </div>

      {/* ─── Search ─────────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
        <div className="relative">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns by name, channel, or status..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>
      </div>

      {/* ─── Campaigns Table ────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading campaigns from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Megaphone className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No campaigns found</h4>
            <p className="text-xs text-[#968a7e] mt-1">Campaign tracking entries will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[220px]">Campaign Name</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Source Channel</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Budget</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Leads Generated</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(camp => (
                  <tr key={camp.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4 font-semibold text-white">
                      {camp.name}
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d8a868]/10 text-[#d8a868] border border-[#d8a868]/20">
                        {camp.source_channel || 'Meta Ads'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#d8a868]">
                      {formatPrice(camp.budget)}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-emerald-400">
                      {camp.leads_generated || 0}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        camp.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="capitalize">{camp.status || 'Active'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsManagementView;

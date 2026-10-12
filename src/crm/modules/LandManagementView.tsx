/**
 * LandManagementView.tsx — Land Listings & Agricultural / Residential Plots
 * Real MySQL land_listings inventory • Survey numbers, cents, grounds, and acres units
 * Aura Privé design • High legibility typography • Responsive horizontal scroll
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Trees,
  Search,
  RefreshCw,
  MapPin,
  FileCheck2,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  Droplet,
  Compass,
} from 'lucide-react';

export const LandManagementView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [landListings, setLandListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchLand = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/land', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied');
            setLandListings([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setLandListings(d.data || []);
        });
      })
      .catch(err => console.error('[LandManagementView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLand();
  }, [activeRole]);

  const filtered = landListings.filter(l => {
    const matchesSearch =
      !search ||
      l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase()) ||
      l.survey_number?.toLowerCase().includes(search.toLowerCase()) ||
      l.locality?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || l.land_type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || l.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatPrice = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
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
            <span>Land Listings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {landListings.length} Parcels
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Plots, agricultural parcels, commercial acreage, and coastal development tracts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLand}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Land Listings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Quick Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Total Parcels</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-white">{landListings.length}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Available</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">
            {landListings.filter(l => l.status === 'available').length}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Residential Plots</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-sky-400">
            {landListings.filter(l => l.land_type?.includes('residential')).length}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Agricultural & Farm</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-[#d8a868]">
            {landListings.filter(l => l.land_type?.includes('agricultural')).length}
          </div>
        </div>
      </div>

      {/* ─── Search & Filters ────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search land by title, survey number, city, or village..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          >
            <option value="ALL">All Land Types</option>
            <option value="residential_land">Residential Land</option>
            <option value="agricultural">Agricultural</option>
            <option value="commercial">Commercial Land</option>
            <option value="coastal">Coastal Plots</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          >
            <option value="ALL">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="under_offer">Under Offer</option>
          </select>
        </div>
      </div>

      {/* ─── Land Listings Table ─────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading land parcels from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Trees className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No land records match your filter</h4>
            <p className="text-xs text-[#968a7e] mt-1">Adjust search parameters or clear filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[950px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[240px]">Parcel Title & Location</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Land Type</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Area / Extent</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Expected Price</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Survey No.</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Infrastructure</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(parcel => (
                  <tr key={parcel.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {parcel.title}
                      </div>
                      <div className="text-xs text-[#968a7e] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#d8a868] shrink-0" />
                        <span>{parcel.village ? `${parcel.village}, ` : ''}{parcel.city || 'Tamil Nadu'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d8a868]/10 text-[#d8a868] border border-[#d8a868]/20">
                        {String(parcel.land_type || 'Land').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold">
                      {parcel.total_area} {parcel.area_unit || 'cents'}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#d8a868]">
                      {formatPrice(parcel.expected_price)}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[#c9c0b5]">
                      {parcel.survey_number || '—'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-xs">
                        {parcel.water_availability && (
                          <span className="text-sky-400" title="Water Available">💧 Water</span>
                        )}
                        {parcel.electricity_availability && (
                          <span className="text-amber-400" title="Electricity Available">⚡ Power</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        parcel.status === 'available'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="capitalize">{parcel.status || 'Available'}</span>
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

export default LandManagementView;

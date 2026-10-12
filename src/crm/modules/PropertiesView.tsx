/**
 * PropertiesView.tsx — Property Management View
 * Real MySQL properties inventory • Filtering by type and status • Search
 * Aura Privé design • High legibility typography • Responsive horizontal scroll
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Building2,
  Search,
  RefreshCw,
  Plus,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Home,
} from 'lucide-react';

export const PropertiesView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchProperties = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/properties', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied');
            setProperties([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setProperties(d.data || []);
        });
      })
      .catch(err => console.error('[PropertiesView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProperties();
  }, [activeRole]);

  const filtered = properties.filter(p => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.locality?.toLowerCase().includes(search.toLowerCase()) ||
      p.building_name?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || p.property_type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === 'ALL' || p.status?.toLowerCase() === statusFilter.toLowerCase();

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
            <span>Property Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {properties.length} Active Listings
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Luxury residential apartments, penthouses, and gated villa developments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProperties}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Listings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Quick Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Total Inventory</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-white">{properties.length}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Available</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">
            {properties.filter(p => p.status === 'available').length}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Apartments</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-sky-400">
            {properties.filter(p => p.property_type === 'apartment').length}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Villas & Penthouses</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-[#d8a868]">
            {properties.filter(p => ['villa', 'penthouse'].includes(p.property_type)).length}
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
            placeholder="Search by title, building, city, or locality..."
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
            <option value="ALL">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="penthouse">Penthouse</option>
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

      {/* ─── Properties Table ────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading property listings from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Building2 className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No properties match your filter</h4>
            <p className="text-xs text-[#968a7e] mt-1">Adjust search terms or clear filters to see all inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[950px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[240px]">Property Title & Location</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Type</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Specifications</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Price</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Status</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Verification</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(prop => (
                  <tr key={prop.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {prop.title}
                      </div>
                      <div className="text-xs text-[#968a7e] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#d8a868] shrink-0" />
                        <span>{prop.locality ? `${prop.locality}, ` : ''}{prop.city || 'Chennai'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d8a868]/10 text-[#d8a868] border border-[#d8a868]/20">
                        {prop.property_type || 'Apartment'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 text-xs text-[#968a7e]">
                        {prop.bedrooms && (
                          <span className="flex items-center gap-1" title="Bedrooms">
                            <Bed className="w-3.5 h-3.5 text-[#d8a868]" /> {prop.bedrooms} BHK
                          </span>
                        )}
                        {prop.built_up_area && (
                          <span className="flex items-center gap-1" title="Area">
                            <Maximize2 className="w-3 h-3 text-[#d8a868]" /> {prop.built_up_area} {prop.area_unit || 'sqft'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#d8a868]">
                      {formatPrice(prop.price)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        prop.status === 'available'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="capitalize">{prop.status || 'Available'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
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

export default PropertiesView;

/**
 * LeadManagementView.tsx — Clean, High-Priority Lead Tracking Page
 * Complete Table Columns • 9 Quick Filters • Search • Pagination • Lead Detail Drawer Integration
 * Dual Dark / Light theme support • High readability typography • Spacious row heights
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Users,
  Search,
  Flame,
  SunMedium,
  Snowflake,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  UserCheck,
} from 'lucide-react';

type FilterType =
  | 'ALL'
  | 'NEW'
  | 'HOT'
  | 'WARM'
  | 'COLD'
  | 'UNASSIGNED'
  | 'FOLLOWUP_DUE'
  | 'WON'
  | 'LOST';

export const LeadManagementView: React.FC = () => {
  const { setSelectedLeadId, setIsAddLeadOpen, globalSearch, setGlobalSearch, theme } = useCrm();

  const isDark = theme === 'dark';

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState(globalSearch || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  // Sync if globalSearch changes from header
  useEffect(() => {
    if (globalSearch) {
      setSearch(globalSearch);
      setPage(1);
    }
  }, [globalSearch]);

  const fetchLeads = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '15',
      search: search.trim(),
    });

    if (filter === 'HOT' || filter === 'WARM' || filter === 'COLD') {
      params.append('temperature', filter);
    } else if (filter === 'NEW') {
      params.append('status', 'new');
    } else if (filter === 'UNASSIGNED') {
      params.append('filter', 'unassigned');
    } else if (filter === 'FOLLOWUP_DUE') {
      params.append('filter', 'followup_due');
    } else if (filter === 'WON') {
      params.append('filter', 'won');
    } else if (filter === 'LOST') {
      params.append('filter', 'lost');
    }

    fetch(`/api/crm/leads?${params.toString()}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setLeads(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalLeads(res.pagination?.total || 0);
        }
      })
      .catch(err => console.error('[Leads View] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const formatCurrency = (val?: number) => {
    if (!val) return 'Stated in call';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'new').toLowerCase();
    if (s.includes('won')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (s.includes('lost')) return 'bg-zinc-700/40 text-zinc-400 border-zinc-600/40';
    if (s.includes('qualif')) return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    if (s.includes('visit')) return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    if (s.includes('negot')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (s.includes('contact')) return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    return 'bg-amber-400/20 text-amber-300 border-amber-400/30';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── 1. Header & Controls ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${
              isDark ? 'text-white' : 'text-[#1c1b1e]'
            }`}
          >
            <span>Lead Tracking</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/20 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {totalLeads} Total Inquiries
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Live synchronized with client AI chatbot, phone calls, and employee assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Leads Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-sm font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Search Bar & Filter Tabs ──────────────────────────────── */}
      <div
        className={`space-y-4 p-4 rounded-2xl border transition-colors ${
          isDark
            ? 'border-[#28232D] bg-[#141217]'
            : 'border-[#E2D8D1] bg-white'
        }`}
      >
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative w-full">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setGlobalSearch(e.target.value);
            }}
            placeholder="Search by name, phone, email, location, lead ID, or requirement..."
            className={`w-full pl-10 pr-24 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#d8a868]/60 ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e] placeholder-[#817568]/60'
            }`}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-lg bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* 9 Simple Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { key: 'ALL', label: 'All Leads' },
            { key: 'NEW', label: 'New' },
            { key: 'HOT', label: '🔥 HOT' },
            { key: 'WARM', label: '☀️ WARM' },
            { key: 'COLD', label: '❄️ COLD' },
            { key: 'UNASSIGNED', label: 'Unassigned' },
            { key: 'FOLLOWUP_DUE', label: 'Follow-up Due' },
            { key: 'WON', label: 'Won Deals' },
            { key: 'LOST', label: 'Lost' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key as FilterType);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                filter === f.key
                  ? 'bg-[#d8a868] text-[#0B0A0C] shadow-sm'
                  : isDark
                  ? 'bg-[#18161B] text-[#c9c0b5] border border-[#28232D] hover:text-white hover:border-[#d8a868]/40'
                  : 'bg-[#FAF7F2] text-[#817568] border border-[#E2D8D1] hover:text-[#1c1b1e] hover:border-[#d8a868]/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. Leads Table ───────────────────────────────────────────── */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
          isDark
            ? 'border-[#28232D] bg-[#141217]'
            : 'border-[#E2D8D1] bg-white'
        }`}
      >
        {loading ? (
          <div className="py-24 text-center text-sm text-[#968a7e] animate-pulse">
            Querying leads repository in MySQL...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <p
              className={`text-base font-bold ${
                isDark ? 'text-white' : 'text-[#1c1b1e]'
              }`}
            >
              No matching leads found
            </p>
            <p
              className={`text-xs mt-1 max-w-sm mx-auto ${
                isDark ? 'text-[#968a7e]' : 'text-[#817568]'
              }`}
            >
              {search
                ? `No leads matched "${search}". Try resetting the search.`
                : 'No leads currently match this filter tab.'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setGlobalSearch('');
                setFilter('ALL');
              }}
              className={`mt-4 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-[#28232D] bg-[#18161B] text-[#d8a868] hover:bg-[#201e25]'
                  : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#7d571f] hover:bg-[#eae3dc]'
              }`}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1250px]">
              <thead>
                <tr
                  className={`border-b text-xs font-bold uppercase tracking-wider ${
                    isDark
                      ? 'border-[#28232D] bg-[#18161B] text-[#968a7e]'
                      : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568]'
                  }`}
                >
                  <th className="py-3.5 px-4">Lead ID</th>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Requirement</th>
                  <th className="py-3.5 px-4">Intent</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Temperature</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Next Follow-up</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-[#28232D]/60' : 'divide-[#E2D8D1]'
                }`}
              >
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`transition-colors cursor-pointer group ${
                      isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {/* Lead ID */}
                    <td className="py-4 px-4 font-mono text-xs text-[#d8a868] font-bold">
                      #{lead.id.slice(0, 6)}
                    </td>

                    {/* Customer Name */}
                    <td className="py-4 px-4 font-semibold">
                      <div
                        className={`text-sm group-hover:text-[#d8a868] transition-colors ${
                          isDark ? 'text-white' : 'text-[#1c1b1e]'
                        }`}
                      >
                        {lead.full_name || 'Prospect'}
                      </div>
                      {lead.email && (
                        <div
                          className={`text-xs font-normal truncate max-w-[140px] mt-0.5 ${
                            isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                          }`}
                        >
                          {lead.email}
                        </div>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-4 font-mono text-sm">
                      {lead.phone ? (
                        <span
                          className={`flex items-center gap-1.5 ${
                            isDark ? 'text-[#c9c0b5]' : 'text-[#1c1b1e]'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#d8a868]" />
                          <span>{lead.phone}</span>
                        </span>
                      ) : (
                        <span className="text-[#968a7e]/60 italic text-xs">—</span>
                      )}
                    </td>

                    {/* Requirement */}
                    <td
                      className={`py-4 px-4 text-sm capitalize font-medium ${
                        isDark ? 'text-[#e6e1e5]' : 'text-[#1c1b1e]'
                      }`}
                    >
                      {lead.property_type || 'Residential'}
                    </td>

                    {/* Intent */}
                    <td className="py-4 px-4">
                      <span
                        className={`capitalize px-2.5 py-0.5 rounded text-xs font-bold ${
                          isDark
                            ? 'bg-[#28232D] text-[#c9c0b5]'
                            : 'bg-[#FAF7F2] text-[#817568] border border-[#E2D8D1]'
                        }`}
                      >
                        {lead.intent || 'buy'}
                      </span>
                    </td>

                    {/* Location */}
                    <td
                      className={`py-4 px-4 text-sm ${
                        isDark ? 'text-[#c9c0b5]' : 'text-[#1c1b1e]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#968a7e]" />
                        <span>{lead.city || 'Chennai'}</span>
                      </span>
                    </td>

                    {/* Budget */}
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#d8a868]">
                      {lead.budget_max
                        ? formatCurrency(Number(lead.budget_max))
                        : lead.budget_min
                        ? formatCurrency(Number(lead.budget_min))
                        : 'Unstated'}
                    </td>

                    {/* Lead Temperature */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1.5 ${
                          lead.temperature === 'HOT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : lead.temperature === 'WARM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        }`}
                      >
                        {lead.temperature === 'HOT' && <Flame className="w-3.5 h-3.5" />}
                        {lead.temperature === 'WARM' && <SunMedium className="w-3.5 h-3.5" />}
                        {lead.temperature === 'COLD' && <Snowflake className="w-3.5 h-3.5" />}
                        {lead.temperature || 'WARM'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded font-bold capitalize border ${getStatusBadge(
                          lead.pipeline_status
                        )}`}
                      >
                        {lead.pipeline_status || 'New'}
                      </span>
                    </td>

                    {/* Assigned Employee */}
                    <td
                      className={`py-4 px-4 text-sm ${
                        lead.assigned_employee_name
                          ? isDark
                            ? 'text-[#c9c0b5]'
                            : 'text-[#1c1b1e]'
                          : 'text-[#968a7e]/70 italic'
                      }`}
                    >
                      {lead.assigned_employee_name || 'Unassigned'}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-4 px-4 text-xs font-medium">
                      {lead.next_followup ? (
                        <span className="flex items-center gap-1 text-[#f0be7c]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(lead.next_followup).toLocaleDateString()}</span>
                        </span>
                      ) : (
                        <span className="text-[#968a7e]/60">—</span>
                      )}
                    </td>

                    {/* Last Interaction */}
                    <td
                      className={`py-4 px-4 text-xs ${
                        isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                      }`}
                    >
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm cursor-pointer ${
                          isDark
                            ? 'bg-[#28232D] hover:bg-[#d8a868] hover:text-[#0B0A0C] text-[#f0be7c]'
                            : 'bg-[#FAF7F2] hover:bg-[#d8a868] hover:text-white text-[#7d571f] border border-[#E2D8D1]'
                        }`}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── 4. Pagination ──────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div
            className={`p-4 border-t flex items-center justify-between text-xs transition-colors ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e]'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568]'
            }`}
          >
            <span>
              Showing Page {page} of {totalPages} ({totalLeads} total records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-xl border text-white disabled:opacity-40 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#28232D] bg-[#141217] hover:bg-[#201e25]'
                    : 'border-[#E2D8D1] bg-white text-[#1c1b1e] hover:bg-[#FAF7F2]'
                }`}
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span
                className={`font-bold px-2.5 ${
                  isDark ? 'text-white' : 'text-[#1c1b1e]'
                }`}
              >
                {page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded-xl border text-white disabled:opacity-40 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#28232D] bg-[#141217] hover:bg-[#201e25]'
                    : 'border-[#E2D8D1] bg-white text-[#1c1b1e] hover:bg-[#FAF7F2]'
                }`}
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManagementView;

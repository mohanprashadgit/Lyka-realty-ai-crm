/**
 * CustomerManagementView.tsx — Dedicated Customer Directory Page
 * Search • Advanced Filters (Inquiry Status, Preferred Contact, Sorting)
 * View Dossier • Edit Profile Workflow • Real MySQL customer records
 * Dual Dark / Light theme support • High readability typography • Spacious row heights
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  MessageSquare,
  Edit3,
  SlidersHorizontal,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';

export const CustomerManagementView: React.FC = () => {
  const { setSelectedCustomerId, setIsAddCustomerOpen, activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasLeadsFilter, setHasLeadsFilter] = useState('ALL');
  const [contactFilter, setContactFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const fetchCustomers = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '15',
      search: search.trim(),
    });

    if (hasLeadsFilter !== 'ALL') {
      params.append('has_leads', hasLeadsFilter);
    }
    if (contactFilter !== 'ALL') {
      params.append('preferred_contact', contactFilter);
    }
    if (sortBy !== 'recent') {
      params.append('sort', sortBy);
    }

    fetch(`/api/crm/customers?${params.toString()}`, {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setCustomers(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotalCustomers(res.pagination?.total || 0);
        }
      })
      .catch(err => console.error('[Customers View] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, hasLeadsFilter, contactFilter, sortBy, activeRole]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* ─── Header & Top Actions ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${
              isDark ? 'text-white' : 'text-[#1c1b1e]'
            }`}
          >
            <span>Customer Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {totalCustomers} {totalCustomers === 1 ? 'Verified Client' : 'Verified Clients'}
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Centralized client relationship profiles and lifetime property interaction dossiers
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white hover:border-[#d8a868]/40'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e] hover:border-[#d8a868]/60'
            }`}
            title="Refresh Customers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-sm font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* ─── Search & Supported Filters Bar ────────────────────────────── */}
      <div
        className={`p-4 rounded-2xl border transition-colors flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
          isDark
            ? 'border-[#28232D] bg-[#141217]'
            : 'border-[#E2D8D1] bg-white'
        }`}
      >
        {/* Search Input */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients by name, phone, email, or city..."
            className={`w-full pl-9 pr-9 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#d8a868]/60 ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e] placeholder-[#817568]/60'
            }`}
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#968a7e] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0">
          {/* Filter: Inquiry Linkage */}
          <select
            value={hasLeadsFilter}
            onChange={e => {
              setHasLeadsFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          >
            <option value="ALL">All Clients</option>
            <option value="yes">With Inquiries</option>
            <option value="no">Direct Contacts Only</option>
          </select>

          {/* Filter: Preferred Contact */}
          <select
            value={contactFilter}
            onChange={e => {
              setContactFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          >
            <option value="ALL">All Channels</option>
            <option value="phone">Phone Call</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#d8a868]'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#7d571f]'
            }`}
          >
            <option value="recent">Sort: Newest First</option>
            <option value="name">Sort: Alphabetical (A-Z)</option>
            <option value="leads">Sort: Most Inquiries</option>
          </select>
        </div>
      </div>

      {/* ─── Customer Data Table ─────────────────────────────────────── */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
          isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
        }`}
      >
        {loading ? (
          <div className="py-24 text-center text-sm text-[#968a7e] animate-pulse">
            Loading verified customers from MySQL database...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-24 text-center p-6">
            <UserCheck className="w-12 h-12 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
              No customer records found
            </h4>
            <p className="text-xs text-[#968a7e] mt-1 max-w-sm mx-auto">
              {search || hasLeadsFilter !== 'ALL' || contactFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filters to locate client profiles.'
                : 'New customers are automatically verified and linked from incoming AI chat and voice sessions.'}
            </p>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#d8a868] text-[#0B0A0C] text-xs font-bold shadow hover:bg-[#f0be7c] transition-all cursor-pointer"
            >
              + Add Customer Profile
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1080px]">
              <thead>
                <tr
                  className={`border-b text-xs font-bold uppercase tracking-wider ${
                    isDark
                      ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60'
                      : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                  }`}
                >
                  <th className="py-3.5 px-4 min-w-[240px]">Customer Name</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Direct Phone</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Email Address</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Current Location</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Channel</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Inquiries</th>
                  <th className="py-3.5 px-4 min-w-[150px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-xs ${
                  isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'
                }`}
              >
                {customers.map(cust => (
                  <tr
                    key={cust.id}
                    className={`transition-colors group ${
                      isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {/* Customer Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#d8a868]/20 border border-[#d8a868]/40 flex items-center justify-center font-bold text-xs text-[#d8a868] shrink-0">
                          {cust.full_name?.charAt(0) || 'C'}
                        </div>
                        <div className="min-w-0">
                          <div
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className={`font-semibold text-sm cursor-pointer hover:text-[#d8a868] transition-colors truncate ${
                              isDark ? 'text-white' : 'text-[#1c1b1e]'
                            }`}
                          >
                            {cust.full_name || 'Verified Client'}
                          </div>
                          <div className="text-[11px] text-[#968a7e] mt-0.5">
                            Member since {new Date(cust.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Direct Phone */}
                    <td className="py-4 px-4 font-mono font-medium text-[#c9c0b5]">
                      {cust.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#d8a868]" />
                          <span>{cust.phone}</span>
                        </span>
                      ) : (
                        <span className="text-[#968a7e]">—</span>
                      )}
                    </td>

                    {/* Email Address */}
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      {cust.email ? (
                        <span className="flex items-center gap-1.5 truncate max-w-[190px]" title={cust.email}>
                          <Mail className="w-3.5 h-3.5 text-[#d8a868] shrink-0" />
                          <span className="truncate">{cust.email}</span>
                        </span>
                      ) : (
                        <span className="text-[#968a7e]">—</span>
                      )}
                    </td>

                    {/* Current Location */}
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5 text-[#d8a868] shrink-0" />
                        <span className="truncate">{cust.current_location || 'Chennai, India'}</span>
                      </span>
                    </td>

                    {/* Preferred Channel */}
                    <td className="py-4 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d8a868]/10 text-[#d8a868] border border-[#d8a868]/20">
                        {cust.preferred_contact || 'Phone'}
                      </span>
                    </td>

                    {/* Inquiries Badge */}
                    <td className="py-4 px-4 font-mono">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          Number(cust.linked_leads_count || 0) > 0
                            ? 'bg-[#d8a868]/15 text-[#d8a868] border border-[#d8a868]/30'
                            : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>{cust.linked_leads_count || 0}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCustomerId(cust.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#d8a868]/40 bg-[#d8a868]/10 hover:bg-[#d8a868]/20 text-[#f0be7c] font-bold text-xs transition-colors cursor-pointer"
                          title="Open 7-Tab Profile Dossier"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination Footer ───────────────────────────────────────── */}
        {totalPages > 1 && (
          <div
            className={`p-4 border-t flex items-center justify-between text-xs ${
              isDark
                ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60'
                : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
            }`}
          >
            <span>
              Page {page} of {totalPages} ({totalCustomers} total clients)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer"
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

export default CustomerManagementView;

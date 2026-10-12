/**
 * SiteVisitsView.tsx — Site Visits & Property Inspection Appointments
 * Real MySQL site_visits • Status badges (Scheduled, Completed, Cancelled)
 * Aura Privé design • Responsive table layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  CalendarClock,
  Search,
  RefreshCw,
  Building2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const SiteVisitsView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchVisits = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/site-visits', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied');
            setVisits([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setVisits(d.data || []);
        });
      })
      .catch(err => console.error('[SiteVisitsView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVisits();
  }, [activeRole]);

  const filtered = visits.filter(v => {
    const matchesSearch =
      !search ||
      v.prospect_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.property_title?.toLowerCase().includes(search.toLowerCase()) ||
      v.employee_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
            <span>Site Visits & Appointments</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {visits.length} Appointments
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Customer property inspections, scheduled viewing appointments, and agent feedback
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchVisits}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Appointments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Scheduled Visits</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-[#d8a868]">
            {visits.filter(v => v.status === 'scheduled').length}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Completed</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">
            {visits.filter(v => v.status === 'completed').length}
          </div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Cancelled</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-rose-400">
            {visits.filter(v => v.status === 'cancelled').length}
          </div>
        </div>
      </div>

      {/* ─── Search Bar ──────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search visits by prospect, property, or agent..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
            isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
          }`}
        >
          <option value="ALL">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ─── Visits Table ────────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading site visits from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <CalendarClock className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No site visits found</h4>
            <p className="text-xs text-[#968a7e] mt-1">Scheduled appointments appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[150px]">Date & Time</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Prospect</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Property Listing</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Assigned Agent</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Status</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Feedback / Outcome</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(visit => (
                  <tr key={visit.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4 font-mono">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-[#968a7e] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#d8a868]" /> {visit.visit_time}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#c9c0b5]">
                      {visit.prospect_name || 'Verified Client'}
                    </td>
                    <td className="py-4 px-4">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {visit.property_title || 'General Property Viewing'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      {visit.employee_name || 'Assigned Consultant'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        visit.status === 'scheduled'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : visit.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="capitalize">{visit.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#968a7e]">
                      {visit.feedback || visit.outcome || 'Pending tour execution'}
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

export default SiteVisitsView;

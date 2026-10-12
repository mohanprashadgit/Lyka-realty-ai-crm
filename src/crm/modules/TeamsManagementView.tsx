/**
 * TeamsManagementView.tsx — Brokerage Teams, Departments & Organizational Hierarchy
 * Real MySQL teams • RBAC Restricted (Super Admin, Admin, Sales Manager)
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Network,
  Search,
  RefreshCw,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const TeamsManagementView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchTeams = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/teams', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied: Only Super Admin, Admin, or Sales Manager can access teams management.');
            setTeams([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setTeams(d.data || []);
        });
      })
      .catch(err => console.error('[TeamsView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTeams();
  }, [activeRole]);

  const filtered = teams.filter(t => {
    return (
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.department?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    );
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
            <span>Teams & Departments</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {teams.length} Teams
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Departmental structures, reporting lines, and territorial divisions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTeams}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Teams"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Search Bar ──────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
        <div className="relative">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams by name, department, or description..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>
      </div>

      {/* ─── Teams Grid & Table ──────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading teams from MySQL database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Network className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No teams found</h4>
            <p className="text-xs text-[#968a7e] mt-1">Teams defined in MySQL appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[220px]">Team Name</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Department</th>
                  <th className="py-3.5 px-4 min-w-[300px]">Description & Focus</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(team => (
                  <tr key={team.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {team.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#968a7e] mt-0.5">ID: {team.id}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d8a868]/10 text-[#d8a868] border border-[#d8a868]/20">
                        {team.department || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#968a7e]">
                      {team.description || 'Dedicated operations team'}
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

export default TeamsManagementView;

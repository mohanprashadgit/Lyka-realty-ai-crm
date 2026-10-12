/**
 * PerformanceRewardsView.tsx — Performance & Rewards Points Ledger
 * Real MySQL reward_ledger & employees leaderboard • Attainment tracking
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Award,
  Trophy,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const PerformanceRewardsView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [rewards, setRewards] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setForbiddenError(null);
    Promise.all([
      fetch('/api/crm/rewards', { headers: { 'x-user-role': activeRole } }).then(r => r.json()),
      fetch('/api/crm/employees', { headers: { 'x-user-role': activeRole } }).then(r => r.json()),
    ])
      .then(([rewRes, empRes]) => {
        if (rewRes.success) setRewards(rewRes.data || []);
        if (empRes.success) setEmployees(empRes.data || []);
      })
      .catch(err => console.error('[PerformanceView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeRole]);

  const filteredRewards = rewards.filter(r => {
    return (
      !search ||
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.event_type?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const sortedLeaderboard = [...employees].sort((a, b) => (b.points_balance || 0) - (a.points_balance || 0));

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
            <span>Performance & Rewards</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              Live Points Ledger
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Gamification rewards ledger, lead conversion points, and staff performance rankings
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Rewards"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Leaderboard Highlights ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedLeaderboard.slice(0, 3).map((emp, idx) => (
          <div
            key={emp.id}
            className={`p-5 rounded-2xl border relative overflow-hidden ${
              isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${
                idx === 0 ? 'text-[#d8a868]' : idx === 1 ? 'text-zinc-400' : 'text-amber-700'
              }`}>
                Rank #{idx + 1} • {idx === 0 ? 'Gold Star' : idx === 1 ? 'Silver' : 'Bronze'}
              </span>
              <Trophy className={`w-5 h-5 ${idx === 0 ? 'text-[#d8a868]' : 'text-[#968a7e]'}`} />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d8a868]/20 border border-[#d8a868]/40 flex items-center justify-center font-bold text-sm text-[#d8a868]">
                {emp.full_name?.charAt(0)}
              </div>
              <div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>{emp.full_name}</h4>
                <p className="text-xs text-[#968a7e]">{emp.role}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#28232D] flex items-center justify-between">
              <span className="text-xs text-[#968a7e]">Total Accumulated</span>
              <span className="text-lg font-extrabold font-mono text-[#d8a868]">
                {emp.points_balance || 0} pts
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search & Transaction Ledger ─────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search point transactions by employee or reason..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>
      </div>

      {/* ─── Ledger Table ────────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading reward transactions from database...
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Award className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No transactions recorded</h4>
            <p className="text-xs text-[#968a7e] mt-1">Lead qualification and sales bonuses will appear in this ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[180px]">Employee</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Event Type</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Points</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Reason / Source</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Date</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filteredRewards.map(rew => (
                  <tr key={rew.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4 font-semibold text-[#c9c0b5]">
                      {rew.employee_name || 'Staff Member'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#d8a868]/10 text-[#d8a868] border border-[#d8a868]/20">
                        {String(rew.event_type || 'Bonus').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-sm">
                      <span className={`inline-flex items-center gap-1 ${
                        rew.direction === 'debit' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {rew.direction === 'debit' ? '-' : '+'}{rew.points} pts
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      {rew.reason || 'Lead qualification metric bonus'}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#968a7e]">
                      {new Date(rew.created_at).toLocaleDateString()}
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

export default PerformanceRewardsView;

/**
 * UserManagementView.tsx — User Administration & RBAC Security Matrix
 * Real MySQL users & roles • RBAC Restricted (Super Admin ONLY)
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  UserCheck,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/users', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied: User Administration is strictly restricted to Super Admin executive credentials.');
            setUsers([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setUsers(d.data || []);
        });
      })
      .catch(err => console.error('[UserManagementView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [activeRole]);

  const filtered = users.filter(u => {
    return (
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (forbiddenError) {
    return (
      <div className="py-20 text-center rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 max-w-xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Super Admin Access Required</h3>
        <p className="text-xs text-[#968a7e] mt-2">{forbiddenError}</p>
        <p className="text-[11px] text-[#968a7e]/60 mt-4">
          Switch to <span className="text-[#d8a868] font-semibold">Super Admin</span> in the top-right Dev Role Preview dropdown to inspect security controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
            <span>User Administration & Security</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-mono font-bold border border-rose-500/30">
              Executive Level Only
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Role-based access matrix, security permissions, credential governance, and system users
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
              : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
          }`}
          title="Refresh Users"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
        </button>
      </div>

      {/* ─── Security Overview Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Active User Accounts</div>
          <div className="text-2xl font-extrabold font-mono mt-1 text-white">{users.length}</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Security Scope</div>
          <div className="text-xl font-bold mt-1 text-[#d8a868]">Global Executive</div>
        </div>
        <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#968a7e]">Backend RBAC Status</div>
          <div className="text-xl font-bold mt-1 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Enforced
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
            placeholder="Search system accounts by name, email, or role..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>
      </div>

      {/* ─── Users Table ────────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading user access matrix from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <ShieldCheck className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No accounts match</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[220px]">Account User</th>
                  <th className="py-3.5 px-4 min-w-[160px]">System Role</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Department</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Territory Scope</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(u => (
                  <tr key={u.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {u.full_name}
                      </div>
                      <div className="text-xs text-[#968a7e]">{u.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.role === 'Super Admin'
                          ? 'bg-[#d8a868]/20 text-[#d8a868] border border-[#d8a868]/40'
                          : u.role === 'Admin'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'bg-zinc-500/15 text-zinc-300 border border-zinc-500/30'
                      }`}>
                        <span>{u.role}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      {u.department}
                    </td>
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      {u.assigned_territory || 'Chennai HQ'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
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

export default UserManagementView;

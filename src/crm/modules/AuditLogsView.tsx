/**
 * AuditLogsView.tsx — Immutable Security Audit Logs & Event Trail
 * Real MySQL audit_logs • RBAC Restricted (Super Admin, Admin)
 * Aura Privé styling • Responsive table layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  FileText,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  User,
  Activity,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/audit-logs', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied: Audit Logs are restricted to Super Admin and Operations Admin.');
            setLogs([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setLogs(d.data || []);
        });
      })
      .catch(err => console.error('[AuditLogsView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [activeRole]);

  const filtered = logs.filter(l => {
    return (
      !search ||
      l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.record_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (forbiddenError) {
    return (
      <div className="py-20 text-center rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 max-w-xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Access Denied</h3>
        <p className="text-xs text-[#968a7e] mt-2">{forbiddenError}</p>
        <p className="text-[11px] text-[#968a7e]/60 mt-4">
          Switch to <span className="text-[#d8a868] font-semibold">Super Admin</span> or <span className="text-[#d8a868] font-semibold">Admin</span> in the top-right preview to inspect.
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
            <span>Security Audit Logs</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {logs.length} Immutable Events
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Complete compliance trail of customer updates, lead conversions, task completions, and database transactions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
              : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
          }`}
          title="Refresh Audit Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
        </button>
      </div>

      {/* ─── Search ─────────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
        <div className="relative">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, entity type, or details..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>
      </div>

      {/* ─── Audit Table ────────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading audit events from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <FileText className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No audit events match</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[170px]">Timestamp</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Actor & Role</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Action</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Record Type</th>
                  <th className="py-3.5 px-4 min-w-[320px]">Event Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(log => (
                  <tr key={log.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#968a7e]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {log.actor_name || 'System User'}
                      </div>
                      <div className="text-[11px] text-[#d8a868]">{log.actor_role || 'Staff'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d8a868]/15 text-[#d8a868] border border-[#d8a868]/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#c9c0b5] font-mono text-xs">
                      {log.record_type}
                    </td>
                    <td className="py-3.5 px-4 text-[#c9c0b5]">
                      {log.details || '—'}
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

export default AuditLogsView;

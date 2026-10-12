/**
 * EmployeeManagementView.tsx — Staff Directory, Targets & Territory Allocation
 * Real MySQL employees • RBAC Restricted (Super Admin, Admin, Sales Manager)
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Briefcase,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Trophy,
  Target,
  ShieldCheck,
} from 'lucide-react';

export const EmployeeManagementView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  const fetchEmployees = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/employees', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied: Only Super Admin, Admin, or Sales Manager can access employee management.');
            setEmployees([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setEmployees(d.data || []);
        });
      })
      .catch(err => console.error('[EmployeeView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployees();
  }, [activeRole]);

  const filtered = employees.filter(emp => {
    const matchesSearch =
      !search ||
      emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.role?.toLowerCase().includes(search.toLowerCase()) ||
      emp.assigned_territory?.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'ALL' || emp.department?.toLowerCase() === deptFilter.toLowerCase();
    return matchesSearch && matchesDept;
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
            <span>Employee Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {employees.length} Staff Members
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Organizational roles, monthly sales targets, reward balances, and assigned territories
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Employees"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search staff by name, email, role, or territory..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>

        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
            isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
          }`}
        >
          <option value="ALL">All Departments</option>
          <option value="Executive">Executive</option>
          <option value="Operations">Operations</option>
          <option value="Sales">Sales</option>
          <option value="Lead Management">Lead Management</option>
          <option value="Marketing">Marketing</option>
        </select>
      </div>

      {/* ─── Employee Directory Table ────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading employees from MySQL database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Briefcase className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No employees match your search</h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[950px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[220px]">Employee Name</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Role & Department</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Contact Info</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Territory</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Monthly Target</th>
                  <th className="py-3.5 px-4 min-w-[100px]">Points</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(emp => (
                  <tr key={emp.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d8a868]/20 border border-[#d8a868]/40 flex items-center justify-center font-bold text-[#d8a868]">
                          {emp.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                            {emp.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-[#968a7e] mt-0.5">ID: {emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#c9c0b5]">{emp.role}</div>
                      <div className="text-[11px] text-[#968a7e] mt-0.5">{emp.department}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[#c9c0b5] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#d8a868]" /> {emp.email}
                      </div>
                      {emp.phone && (
                        <div className="text-xs text-[#968a7e] flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-[#d8a868]" /> {emp.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#d8a868]" />
                        <span>{emp.assigned_territory || 'Chennai HQ'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#d8a868]">
                      {formatPrice(emp.monthly_target)}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#d8a868]/15 text-[#d8a868] border border-[#d8a868]/30">
                        <Trophy className="w-3 h-3" />
                        <span>{emp.points_balance || 0}</span>
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

export default EmployeeManagementView;

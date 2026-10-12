/**
 * OverviewDashboard.tsx — Premium Lyka Realty Aura Privé CRM Dashboard
 * Full-width responsive 12-column grid • Clear visual hierarchy • 100% Real MySQL Data
 * Primary 8-col focus on Recent Leads • Secondary 4-col Follow-ups & Activity
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Users,
  UserPlus,
  Flame,
  SunMedium,
  Snowflake,
  CheckSquare,
  Banknote,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  Calendar,
  Activity,
  UserCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const OverviewDashboard: React.FC = () => {
  const {
    kpis,
    isLoadingKpis,
    setActiveModule,
    setSelectedLeadId,
    setIsAddLeadOpen,
    setIsAddCustomerOpen,
    refreshDashboard,
    activeRole,
    theme,
  } = useCrm();

  const isDark = theme === 'dark';

  const [data, setData] = useState<{
    recentLeads: any[];
    followupsToday: any[];
    pipelineStages: Record<string, number>;
    recentActivities: any[];
  }>({
    recentLeads: [],
    followupsToday: [],
    pipelineStages: {
      new: 0,
      contacted: 0,
      qualified: 0,
      matching: 0,
      site_visit: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    },
    recentActivities: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch('/api/crm/dashboard')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData({
            recentLeads: res.recentLeads || [],
            followupsToday: res.followupsToday || [],
            pipelineStages: res.pipelineStages || {},
            recentActivities: res.recentActivities || [],
          });
        }
      })
      .catch(err => console.error('[Dashboard View] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkTaskComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/crm/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_notes: 'Marked completed on Dashboard' }),
      });
      const resData = await res.json();
      if (resData.success) {
        fetchDashboardData();
        refreshDashboard();
      }
    } catch (err) {
      console.error('[Dashboard View] Complete task error:', err);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── 1. Welcome & Operational Command Bar ──────────────────────── */}
      <div
        className={`rounded-2xl border p-6 shadow-sm transition-colors ${
          isDark
            ? 'border-[#28232D] bg-[#141217]'
            : 'border-[#E2D8D1] bg-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <h2
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#1c1b1e]'
                }`}
              >
                Welcome back to Lyka CRM
              </h2>
              <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] border border-[#d8a868]/30">
                {activeRole}
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm mt-1.5 flex flex-wrap items-center gap-2 ${
                isDark ? 'text-[#968a7e]' : 'text-[#817568]'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#d8a868]" />
              <span>{todayFormatted}</span>
              <span className="opacity-40">•</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live MySQL Sync Active
              </span>
            </p>
          </div>

          {/* Quick Primary Actions — Clean & Distinct (Redundant search field removed) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchDashboardData();
                refreshDashboard();
              }}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white hover:border-[#d8a868]/40'
                  : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e] hover:border-[#d8a868]/60'
              }`}
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
            </button>

            {/* Primary Action: Add Lead */}
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-sm font-bold transition-all shadow-md hover:shadow-lg shrink-0 cursor-pointer"
              title="Record a new inquiry"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Lead</span>
            </button>

            {/* Secondary Action: Add Customer */}
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all shrink-0 cursor-pointer ${
                isDark
                  ? 'border-[#d8a868]/40 bg-[#18161B] hover:bg-[#201e25] text-[#f0be7c]'
                  : 'border-[#d8a868]/60 bg-white hover:bg-[#FAF7F2] text-[#7d571f]'
              }`}
              title="Register a verified customer profile"
            >
              <UserCheck className="w-4 h-4 text-[#d8a868]" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Six High-Impact KPI Metric Cards ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {/* 1. Total Leads */}
        <div
          onClick={() => setActiveModule('leads')}
          className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md min-w-0 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'border-[#28232D] bg-[#141217] hover:border-[#d8a868]/50'
              : 'border-[#E2D8D1] bg-white hover:border-[#d8a868]/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span
              className={`text-xs font-bold uppercase tracking-wider truncate ${
                isDark ? 'text-[#968a7e]' : 'text-[#817568]'
              }`}
            >
              Total Leads
            </span>
            <div
              className={`p-2 rounded-xl transition-transform group-hover:scale-110 shrink-0 ${
                isDark ? 'bg-[#28232D]/70 text-[#d8a868]' : 'bg-[#FAF7F2] text-[#7d571f]'
              }`}
            >
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold font-mono tracking-tight mt-3 mb-1 truncate ${
              isDark ? 'text-white' : 'text-[#1c1b1e]'
            }`}
          >
            {isLoadingKpis ? '—' : kpis?.totalLeads ?? 0}
          </div>
          <div className={`text-xs font-medium truncate ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            All recorded prospects
          </div>
        </div>

        {/* 2. New Leads */}
        <div
          onClick={() => setActiveModule('leads')}
          className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md min-w-0 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'border-[#28232D] bg-[#141217] hover:border-amber-500/50'
              : 'border-[#E2D8D1] bg-white hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500 truncate">
              New Leads
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-amber-400 mt-3 mb-1 truncate">
            {isLoadingKpis ? '—' : kpis?.newLeads ?? 0}
          </div>
          <div className={`text-xs font-medium truncate ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Awaiting initial triage
          </div>
        </div>

        {/* 3. HOT Leads */}
        <div
          onClick={() => setActiveModule('leads')}
          className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md min-w-0 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'border-[#28232D] bg-[#141217] hover:border-rose-500/50'
              : 'border-[#E2D8D1] bg-white hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 truncate">
              HOT Leads
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform shrink-0">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-rose-400 mt-3 mb-1 truncate">
            {isLoadingKpis ? '—' : kpis?.hotLeads ?? 0}
          </div>
          <div className={`text-xs font-medium truncate ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Immediate site-visit ready
          </div>
        </div>

        {/* 4. Total Customers */}
        <div
          onClick={() => setActiveModule('customers')}
          className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md min-w-0 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'border-[#28232D] bg-[#141217] hover:border-violet-500/50'
              : 'border-[#E2D8D1] bg-white hover:border-violet-500/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span
              className={`text-xs font-bold uppercase tracking-wider truncate ${
                isDark ? 'text-[#968a7e]' : 'text-[#817568]'
              }`}
            >
              Total Clients
            </span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-3xl font-extrabold font-mono tracking-tight mt-3 mb-1 truncate ${
              isDark ? 'text-white' : 'text-[#1c1b1e]'
            }`}
          >
            {isLoadingKpis ? '—' : kpis?.totalCustomers ?? 0}
          </div>
          <div className={`text-xs font-medium truncate ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Verified client accounts
          </div>
        </div>

        {/* 5. Follow-ups Due */}
        <div
          onClick={() => setActiveModule('tasks')}
          className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md min-w-0 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'border-[#28232D] bg-[#141217] hover:border-amber-400/50'
              : 'border-[#E2D8D1] bg-white hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 truncate">
              Follow-ups
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-amber-300 mt-3 mb-1 truncate">
            {isLoadingKpis ? '—' : kpis?.pendingTasks ?? 0}
          </div>
          <div className={`text-xs font-medium truncate ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Pending agent tasks
          </div>
        </div>

        {/* 6. Active Deals */}
        <div
          onClick={() => setActiveModule('deals')}
          className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md min-w-0 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'border-[#28232D] bg-[#141217] hover:border-emerald-500/50'
              : 'border-[#E2D8D1] bg-white hover:border-emerald-500/60'
          }`}
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 truncate">
              Active Deals
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-emerald-400 mt-3 mb-1 truncate">
            {isLoadingKpis ? '—' : kpis?.activeDeals ?? 0}
          </div>
          <div className={`text-xs font-medium truncate ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            In active negotiation
          </div>
        </div>
      </div>

      {/* ─── 3. Lead Pipeline Progression Flow ─────────────────────────── */}
      <div
        className={`rounded-2xl border p-5 shadow-sm transition-colors ${
          isDark
            ? 'border-[#28232D] bg-[#141217]'
            : 'border-[#E2D8D1] bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3
              className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-[#1c1b1e]'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-[#d8a868]" />
              <span>Pipeline Funnel Distribution</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
              Live distribution of inquiries from incoming triage to deal closure
            </p>
          </div>
          <button
            onClick={() => setActiveModule('pipeline')}
            className="text-xs text-[#d8a868] hover:text-[#f0be7c] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Open Pipeline Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8 gap-3 text-center">
          {[
            { key: 'new', label: 'New', count: data.pipelineStages.new || 0, color: 'text-amber-400', border: 'border-amber-400/20' },
            { key: 'contacted', label: 'Contacted', count: data.pipelineStages.contacted || 0, color: 'text-sky-400', border: 'border-sky-400/20' },
            { key: 'qualified', label: 'Qualified', count: data.pipelineStages.qualified || 0, color: 'text-violet-400', border: 'border-violet-400/20' },
            { key: 'matching', label: 'Matching', count: data.pipelineStages.matching || 0, color: 'text-indigo-400', border: 'border-indigo-400/20' },
            { key: 'site_visit', label: 'Site Visit', count: data.pipelineStages.site_visit || 0, color: 'text-pink-400', border: 'border-pink-400/20' },
            { key: 'negotiation', label: 'Negotiation', count: data.pipelineStages.negotiation || 0, color: 'text-amber-300', border: 'border-amber-300/20' },
            { key: 'won', label: 'Won', count: data.pipelineStages.won || 0, color: 'text-emerald-400', border: 'border-emerald-400/20' },
            { key: 'lost', label: 'Lost', count: data.pipelineStages.lost || 0, color: 'text-zinc-500', border: 'border-zinc-500/20' },
          ].map((stage, idx) => (
            <div
              key={stage.key}
              onClick={() => setActiveModule('leads')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-[#d8a868]/50 min-w-0 ${
                isDark
                  ? 'border-[#28232D] bg-[#18161B]'
                  : 'border-[#E2D8D1] bg-[#FAF7F2]'
              } ${stage.border}`}
            >
              <div
                className={`text-xs uppercase font-bold tracking-wider truncate ${
                  isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                }`}
              >
                {idx + 1}. {stage.label}
              </div>
              <div className={`text-2xl font-extrabold font-mono mt-1 ${stage.color}`}>
                {stage.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. Main 12-Column Layout ──────────────────────────────────── */}
      {/* 8 Cols: Recent Leads (Primary Focus) • 4 Cols: Follow-ups & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Content Area (8 Cols): Recent Leads */}
        <div
          className={`xl:col-span-8 rounded-2xl border p-6 shadow-sm transition-colors ${
            isDark
              ? 'border-[#28232D] bg-[#141217]'
              : 'border-[#E2D8D1] bg-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3
                className={`text-base font-bold flex items-center gap-2.5 ${
                  isDark ? 'text-white' : 'text-[#1c1b1e]'
                }`}
              >
                <span>Recent Leads</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
                  {data.recentLeads.length} Inquiries
                </span>
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
                Real-time inquiries captured via AI voice assistant, chatbot, and staff triage
              </p>
            </div>

            <button
              onClick={() => setActiveModule('leads')}
              className="text-xs text-[#d8a868] hover:text-[#f0be7c] font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>View All Leads</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
              Loading recent leads from MySQL database...
            </div>
          ) : data.recentLeads.length === 0 ? (
            <div
              className={`py-16 text-center rounded-2xl border border-dashed p-8 ${
                isDark ? 'border-[#28232D]' : 'border-[#E2D8D1]'
              }`}
            >
              <Users className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
              <p
                className={`text-sm font-bold ${
                  isDark ? 'text-white' : 'text-[#1c1b1e]'
                }`}
              >
                No lead inquiries recorded yet
              </p>
              <p className={`text-xs mt-1 max-w-md mx-auto ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
                Leads captured from the client AI assistant appear here automatically. You can also create leads manually.
              </p>
              <button
                onClick={() => setIsAddLeadOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#d8a868] text-[#0B0A0C] text-xs font-bold shadow hover:bg-[#f0be7c] transition-all cursor-pointer"
              >
                + Add First Lead Manually
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left min-w-[880px]">
                <thead>
                  <tr
                    className={`border-b text-xs font-bold uppercase tracking-wider ${
                      isDark
                        ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60'
                        : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                    }`}
                  >
                    <th className="py-3.5 px-4 min-w-[220px]">Customer Name & Contact</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Requirement</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Location</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Budget</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Temperature</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Assigned To</th>
                    <th className="py-3.5 px-4 min-w-[90px] text-right">Action</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'
                  }`}
                >
                  {data.recentLeads.map(lead => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`transition-colors cursor-pointer group ${
                        isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-4">
                        <div
                          className={`text-sm font-semibold group-hover:text-[#d8a868] transition-colors ${
                            isDark ? 'text-white' : 'text-[#1c1b1e]'
                          }`}
                        >
                          {lead.full_name || 'Prospect'}
                        </div>
                        <div
                          className={`text-xs font-mono mt-0.5 ${
                            isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                          }`}
                        >
                          {lead.phone || 'No phone recorded'}
                        </div>
                      </td>

                      {/* Requirement & Intent */}
                      <td className="py-4 px-4">
                        <div
                          className={`text-sm font-medium capitalize ${
                            isDark ? 'text-[#e6e1e5]' : 'text-[#1c1b1e]'
                          }`}
                        >
                          {lead.property_type || 'Residential'}
                        </div>
                        <div
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                          }`}
                        >
                          {lead.intent || 'Buy'}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4">
                        <div
                          className={`text-sm flex items-center gap-1.5 ${
                            isDark ? 'text-[#e6e1e5]' : 'text-[#1c1b1e]'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#968a7e] shrink-0" />
                          <span>{lead.city || 'Chennai'}</span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-4 font-mono font-bold text-sm text-[#d8a868]">
                        {lead.budget_max ? formatCurrency(Number(lead.budget_max)) : 'Stated in call'}
                      </td>

                      {/* Temperature Badge */}
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

                      {/* Assigned Employee */}
                      <td className="py-4 px-4">
                        <span
                          className={`text-sm ${
                            lead.assigned_employee_name
                              ? isDark
                                ? 'text-[#e6e1e5]'
                                : 'text-[#1c1b1e]'
                              : 'text-[#968a7e] italic'
                          }`}
                        >
                          {lead.assigned_employee_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                            isDark
                              ? 'bg-[#28232D] text-[#f0be7c] hover:bg-[#d8a868] hover:text-[#0B0A0C]'
                              : 'bg-[#FAF7F2] text-[#7d571f] hover:bg-[#d8a868] hover:text-white border border-[#E2D8D1]'
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
        </div>

        {/* Secondary Column (4 Cols): Follow-ups Today & Recent Activity */}
        <div className="xl:col-span-4 space-y-6">
          {/* Follow-ups Today Panel */}
          <div
            className={`rounded-2xl border p-6 shadow-sm transition-colors ${
              isDark
                ? 'border-[#28232D] bg-[#141217]'
                : 'border-[#E2D8D1] bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className={`text-base font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-[#1c1b1e]'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Follow-ups Today</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
                  Scheduled client calls & site-visit reminders
                </p>
              </div>
              <button
                onClick={() => setActiveModule('tasks')}
                className="text-xs text-[#d8a868] hover:underline font-semibold cursor-pointer"
              >
                All Tasks
              </button>
            </div>

            {data.followupsToday.length === 0 ? (
              <div
                className={`py-8 text-center rounded-xl border border-dashed p-4 text-xs ${
                  isDark ? 'border-[#28232D]' : 'border-[#E2D8D1]'
                }`}
              >
                <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                <p
                  className={`font-semibold ${
                    isDark ? 'text-white' : 'text-[#1c1b1e]'
                  }`}
                >
                  All caught up for today!
                </p>
                <p className={`mt-0.5 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
                  No pending follow-ups or overdue tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.followupsToday.map((task: any) => (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors ${
                      isDark
                        ? 'border-[#28232D] bg-[#18161B] hover:border-[#d8a868]/40'
                        : 'border-[#E2D8D1] bg-[#FAF7F2] hover:border-[#d8a868]/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold truncate text-sm ${
                            isDark ? 'text-white' : 'text-[#1c1b1e]'
                          }`}
                        >
                          {task.prospect_name || 'Prospect Follow-up'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isDark
                              ? 'bg-[#28232D] text-[#c9c0b5]'
                              : 'bg-white text-[#817568] border border-[#E2D8D1]'
                          }`}
                        >
                          {task.priority || 'Normal'}
                        </span>
                      </div>
                      <div
                        className={`text-xs mt-1 truncate ${
                          isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-[#d8a868] font-medium mt-0.5">
                        Assigned: {task.assigned_employee || 'Staff'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleMarkTaskComplete(task.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      title="Mark task complete"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Log Panel */}
          <div
            className={`rounded-2xl border p-6 shadow-sm transition-colors ${
              isDark
                ? 'border-[#28232D] bg-[#141217]'
                : 'border-[#E2D8D1] bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3
                  className={`text-base font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-[#1c1b1e]'
                  }`}
                >
                  <Activity className="w-4 h-4 text-[#d8a868]" />
                  <span>Recent Activity</span>
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
                  Real-time operational audit events
                </p>
              </div>
              <button
                onClick={() => setActiveModule('audit-logs')}
                className="text-xs text-[#d8a868] hover:underline font-semibold cursor-pointer"
              >
                Full Log
              </button>
            </div>

            {data.recentActivities.length === 0 ? (
              <div
                className={`py-8 text-center text-xs ${
                  isDark ? 'text-[#968a7e]' : 'text-[#817568]'
                }`}
              >
                No recent activity logged yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recentActivities.map((act: any) => (
                  <div
                    key={act.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                      isDark
                        ? 'bg-[#18161B] border-[#28232D]'
                        : 'bg-[#FAF7F2] border-[#E2D8D1]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#d8a868] uppercase">
                        {act.action}
                      </span>
                      <span className={isDark ? 'text-[#968a7e]' : 'text-[#817568]'}>
                        {new Date(act.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-snug ${
                        isDark ? 'text-white' : 'text-[#1c1b1e]'
                      }`}
                    >
                      {act.details || 'System event'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;

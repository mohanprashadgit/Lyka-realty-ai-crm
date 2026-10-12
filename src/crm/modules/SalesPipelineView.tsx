/**
 * SalesPipelineView.tsx — Interactive Lead Pipeline Progression Board
 * Stages: New → Contacted → Qualified → Property Matching → Site Visit → Negotiation → Won / Lost
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  KanbanSquare,
  RefreshCw,
  Plus,
  Flame,
  SunMedium,
  Snowflake,
  MapPin,
  ChevronRight,
} from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'New Inquiry', color: 'border-amber-400/40 text-amber-300' },
  { id: 'contacted', label: 'Contacted', color: 'border-sky-400/40 text-sky-300' },
  { id: 'qualified', label: 'Qualified', color: 'border-violet-400/40 text-violet-300' },
  { id: 'property matching', label: 'Matching', color: 'border-indigo-400/40 text-indigo-300' },
  { id: 'site visit', label: 'Site Visit', color: 'border-pink-400/40 text-pink-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-amber-300/40 text-amber-200' },
  { id: 'won', label: 'Won Deal', color: 'border-emerald-400/40 text-emerald-300' },
  { id: 'lost', label: 'Lost', color: 'border-zinc-600/40 text-zinc-400' },
];

export const SalesPipelineView: React.FC = () => {
  const { setSelectedLeadId, setIsAddLeadOpen, refreshDashboard } = useCrm();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllLeads = () => {
    setLoading(true);
    fetch('/api/crm/leads?limit=100')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setLeads(res.data || []);
        }
      })
      .catch(err => console.error('[Pipeline View] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllLeads();
  }, []);

  const handleAdvanceStage = async (e: React.MouseEvent, leadId: string, currentStage: string) => {
    e.stopPropagation();
    const currIdx = STAGES.findIndex(s => s.id === (currentStage || 'new').toLowerCase());
    if (currIdx < 0 || currIdx >= STAGES.length - 2) return; // don't auto-advance past won/lost
    const nextStage = STAGES[currIdx + 1].id;

    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_status: nextStage }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAllLeads();
        refreshDashboard();
      }
    } catch (err) {
      console.error('[Pipeline View] Advance stage error:', err);
    }
  };

  const formatCurrency = (val?: number) => {
    if (!val) return 'Stated';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Sales Pipeline Board</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/20 text-[#d8a868] font-mono font-bold">
              {leads.length} Leads in Pipeline
            </span>
          </h2>
          <p className="text-xs text-[#968a7e]">
            Drag or click cards to advance prospect deal stages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllLeads}
            disabled={loading}
            className="p-2 rounded-xl border border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white"
            title="Refresh Pipeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Stages Grid */}
      {loading ? (
        <div className="py-24 text-center text-xs text-[#968a7e] animate-pulse">
          Loading pipeline stages...
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#28232D]">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(
              l => (l.pipeline_status || 'new').toLowerCase() === stage.id
            );

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 rounded-2xl border border-[#28232D] bg-[#141217] flex flex-col max-h-[75vh]"
              >
                {/* Stage Header */}
                <div className="p-3.5 border-b border-[#28232D] bg-[#18161B] flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#28232D] text-white">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-[#28232D]">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#968a7e]/60 border border-dashed border-[#28232D]/80 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="p-3 rounded-xl border border-[#28232D] bg-[#18161B] hover:border-[#d8a868]/40 hover:bg-[#1e1c24] cursor-pointer transition-all shadow-xs text-xs space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white truncate max-w-[150px]">
                            {lead.full_name || 'Prospect'}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase inline-flex items-center gap-0.5 ${
                              lead.temperature === 'HOT'
                                ? 'bg-rose-500/20 text-rose-300'
                                : lead.temperature === 'WARM'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {lead.temperature === 'HOT' && <Flame className="w-2.5 h-2.5" />}
                            {lead.temperature === 'WARM' && <SunMedium className="w-2.5 h-2.5" />}
                            {lead.temperature || 'WARM'}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#c9c0b5] capitalize flex items-center justify-between">
                          <span>{lead.property_type || 'Residential'}</span>
                          <span className="font-mono text-[#d8a868] font-bold">
                            {lead.budget_max ? formatCurrency(Number(lead.budget_max)) : 'Stated'}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#968a7e] flex items-center justify-between pt-1 border-t border-[#28232D]/70">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#968a7e]" />
                            <span>{lead.city || 'Chennai'}</span>
                          </span>

                          {stage.id !== 'won' && stage.id !== 'lost' && (
                            <button
                              onClick={e => handleAdvanceStage(e, lead.id, lead.pipeline_status)}
                              className="px-1.5 py-0.5 rounded bg-[#28232D] text-[#d8a868] hover:bg-[#d8a868] hover:text-[#0B0A0C] font-semibold text-[10px] flex items-center gap-0.5 transition-colors"
                              title="Advance to next pipeline stage"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SalesPipelineView;

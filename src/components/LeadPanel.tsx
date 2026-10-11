import React, { useState } from 'react';
import {
  Flame,
  SunMedium,
  Snowflake,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  DollarSign,
  Home,
  UserCheck,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { LeadData, LeadQualificationStatus } from '../types/agent';

interface LeadPanelProps {
  lead: LeadData;
  onResetLead: () => void;
  onApplyPreset: (preset: Partial<LeadData>) => void;
}

export const LeadPanel: React.FC<LeadPanelProps> = ({
  lead,
  onResetLead,
  onApplyPreset,
}) => {
  const [copied, setCopied] = useState(false);

  const getStatusBadge = (status: LeadQualificationStatus) => {
    switch (status) {
      case 'HOT':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase">HOT LEAD</div>
              <div className="text-[10px] text-emerald-300/80">Ready to buy &lt; 90 days</div>
            </div>
          </div>
        );
      case 'WARM':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10">
            <SunMedium className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase">WARM LEAD</div>
              <div className="text-[10px] text-amber-300/80">Interested, 3-6 mo timeline</div>
            </div>
          </div>
        );
      case 'COLD':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Snowflake className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase">COLD LEAD</div>
              <div className="text-[10px] text-slate-400">Casual exploring or long term</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-xs font-bold tracking-wider uppercase">QUALIFYING...</div>
              <div className="text-[10px] text-slate-400">Awaiting user criteria</div>
            </div>
          </div>
        );
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(lead, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lead, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lyka-realty-lead-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Lead Information</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Structured Real Estate CRM Data
          </p>
        </div>
        <div>{getStatusBadge(lead.qualification_status)}</div>
      </div>

      {/* 6 Structured Attributes */}
      <div className="space-y-2.5 flex-1">
        {/* Interest */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              1. Interest / Goal
            </div>
            <div className={`text-xs mt-0.5 font-medium truncate ${lead.interest ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 italic'}`}>
              {lead.interest || 'Not identified yet (e.g. Buying, Investing)'}
            </div>
          </div>
        </div>

        {/* Buyer Type */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              2. Buyer Type
            </div>
            <div className={`text-xs mt-0.5 font-medium truncate ${lead.buyer_type ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 italic'}`}>
              {lead.buyer_type || 'Not identified yet (e.g. First-Time Buyer)'}
            </div>
          </div>
        </div>

        {/* Property Type */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              3. Property Type
            </div>
            <div className={`text-xs mt-0.5 font-medium truncate ${lead.property_type ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 italic'}`}>
              {lead.property_type || 'Not identified yet (e.g. 3BHK Apartment, Villa)'}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              4. Budget Range
            </div>
            <div className={`text-xs mt-0.5 font-bold truncate ${lead.budget ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-400 italic'}`}>
              {lead.budget || 'Not identified yet (e.g. $800k, $1.5M, ₹1.5 Cr)'}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Preferred Location
            </div>
            <div className={`text-xs mt-0.5 font-medium truncate ${lead.location ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 italic'}`}>
              {lead.location || 'Not identified yet (e.g. Downtown, Suburbs)'}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              5. Decision Timeline
            </div>
            <div className={`text-xs mt-0.5 font-medium truncate ${lead.timeline ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 italic'}`}>
              {lead.timeline || 'Not identified yet (e.g. Immediate, 1-3 Months)'}
            </div>
          </div>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div
            data-notes-box="true"
            className="notes-container p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs shadow-sm space-y-1.5 dark:bg-slate-950/80 dark:border-amber-500/30 transition-colors"
          >
            <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
              <span>📝 Internal Notes &amp; Spoken Remarks</span>
            </div>
            <p className="leading-relaxed font-semibold text-slate-900 dark:text-slate-100">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between gap-2">
        <button
          onClick={handleCopyJson}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>

        <button
          onClick={handleExportJson}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
          <span>Export</span>
        </button>

        <button
          onClick={onResetLead}
          title="Reset Lead Details"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Users,
  PhoneCall,
  PhoneForwarded,
  PhoneOff,
  ThumbsUp,
  ThumbsDown,
  Flame,
  SunMedium,
  Snowflake,
  ShieldBan,
  TrendingUp,
  Award,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  RotateCcw,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';
import {
  DashboardStats,
  CallRecord,
  LeadRecord,
  CallStatus,
  LeadData,
  TranscriptTurn,
} from '../types/agent';
import { DateLeadVisualization } from './DateLeadVisualization';
import { LiveConnectInspector } from './LiveConnectInspector';

interface DashboardStatsViewProps {
  stats: DashboardStats;
  calls: CallRecord[];
  leads: LeadRecord[];
  activeLead: LeadRecord | null;
  callStatus: CallStatus;
  callDuration: number;
  leadData: LeadData;
  turns: TranscriptTurn[];
  genderVoice: 'female' | 'male';
  selectedLanguage: string;
  onNavigateToLeads: (filter?: string) => void;
  onOpenImport: () => void;
  onOpenExportReport: () => void;
  onResetAllData: () => void;
  onNavigateToCallScreen: () => void;
  onStartCall: (lead: LeadRecord) => void;
  onEndCall: () => void;
}

export const DashboardStatsView: React.FC<DashboardStatsViewProps> = ({
  stats,
  calls,
  leads,
  activeLead,
  callStatus,
  callDuration,
  leadData,
  turns,
  genderVoice,
  selectedLanguage,
  onNavigateToLeads,
  onOpenImport,
  onOpenExportReport,
  onResetAllData,
  onNavigateToCallScreen,
  onStartCall,
  onEndCall,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Lyka Realty &bull; AI Lead Calling Operations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time conversion metrics calculated from active and completed customer calls
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reset All Data Button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            title="Wipe all calls and reset metrics to zero"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset All Data</span>
          </button>

          {/* Import CSV */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import Leads</span>
          </button>

          {/* Export Excel / PDF / JSON */}
          <button
            onClick={onOpenExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel / PDF / JSON</span>
          </button>

          {/* View Uncalled */}
          <button
            onClick={() => onNavigateToLeads('NOT_CALLED')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/15 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>View Uncalled Leads</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resetting All Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Reset All Dashboard & Call Data?</h3>
                <p className="text-xs text-slate-400">
                  This action will permanently clear all recorded calls, customer transcripts, and reset stats back to clean baseline.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>&bull; Total Calls Cleared: <strong>{calls.length}</strong></div>
              <div>&bull; Stored Leads Reset: <strong>{leads.length}</strong></div>
              <div>&bull; Metrics and qualification rates will reset to 0%</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onResetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md shadow-rose-600/20"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Connect & Active Inspector (Live stream + who is connected + what they told) */}
      <LiveConnectInspector
        callStatus={callStatus}
        callDuration={callDuration}
        activeLead={activeLead}
        leadData={leadData}
        turns={turns}
        genderVoice={genderVoice}
        selectedLanguage={selectedLanguage}
        onNavigateToCallScreen={onNavigateToCallScreen}
        onStartCall={onStartCall}
        onEndCall={onEndCall}
        leads={leads}
      />

      {/* 4 Core Conversion Rates */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Answer Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Answer Rate</span>
            <PhoneForwarded className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {stats.answerRate}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {stats.callsConnected}/{stats.callsMade || 0}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.answerRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Connected vs. Total calls made</p>
        </div>

        {/* Interested Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Interest Rate</span>
            <ThumbsUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {stats.interestedRate}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {stats.interested}/{stats.callsConnected || 0}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.interestedRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Positive interest from connected calls</p>
        </div>

        {/* Qualification Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Qualification Rate</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats.qualificationRate}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {stats.hot + stats.warm}/{stats.callsConnected || 0}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.qualificationRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">HOT + WARM qualified leads</p>
        </div>

        {/* Hot Lead Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hot Lead Rate</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {stats.hotLeadRate}%
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {stats.hot}/{stats.callsConnected || 0}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.hotLeadRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">Immediate buyers (&lt;3 months + budget)</p>
        </div>
      </div>

      {/* Date-Wise Lead Qualification Visualization (Specific Date Hot/Warm/Cold Charts) */}
      <DateLeadVisualization
        calls={calls}
        onOpenExportReport={onOpenExportReport}
        onSelectCallRecord={() => onNavigateToLeads('ALL')}
      />

      {/* 10 Operational Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Leads */}
        <div
          onClick={() => onNavigateToLeads('ALL')}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Leads</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{stats.totalLeads}</div>
          <span className="text-[10px] text-slate-500">In database</span>
        </div>

        {/* Calls Made */}
        <div
          onClick={() => onNavigateToLeads('CALLED')}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Calls Made</span>
            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-400">{stats.callsMade}</div>
          <span className="text-[10px] text-slate-500">Outbound attempts</span>
        </div>

        {/* Calls Connected */}
        <div
          onClick={() => onNavigateToLeads('CONNECTED')}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Connected</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">{stats.callsConnected}</div>
          <span className="text-[10px] text-slate-500">Conversation started</span>
        </div>

        {/* No Answer */}
        <div
          onClick={() => onNavigateToLeads('NO_ANSWER')}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>No Answer</span>
            <PhoneOff className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-300">{stats.noAnswer}</div>
          <span className="text-[10px] text-slate-500">Ringing timeout</span>
        </div>

        {/* Interested */}
        <div
          onClick={() => onNavigateToLeads('INTERESTED')}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Interested</span>
            <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">{stats.interested}</div>
          <span className="text-[10px] text-slate-500">Positive responses</span>
        </div>

        {/* Not Interested */}
        <div
          onClick={() => onNavigateToLeads('NOT_INTERESTED')}
          className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Not Interested</span>
            <ThumbsDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-300">{stats.notInterested}</div>
          <span className="text-[10px] text-slate-500">Declined purchase</span>
        </div>

        {/* HOT */}
        <div
          onClick={() => onNavigateToLeads('HOT')}
          className="bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3.5 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs mb-1 font-bold">
            <span>HOT Leads</span>
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">{stats.hot}</div>
          <span className="text-[10px] text-rose-800 dark:text-rose-300/70 font-medium">&lt; 3 mo + Budget</span>
        </div>

        {/* WARM */}
        <div
          onClick={() => onNavigateToLeads('WARM')}
          className="bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs mb-1 font-bold">
            <span>WARM Leads</span>
            <SunMedium className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{stats.warm}</div>
          <span className="text-[10px] text-amber-800 dark:text-amber-300/70 font-medium">3-6 mo or flexible</span>
        </div>

        {/* COLD */}
        <div
          onClick={() => onNavigateToLeads('COLD')}
          className="bg-sky-50/80 dark:bg-slate-900/90 hover:bg-sky-100 dark:hover:bg-slate-850 border border-sky-200 dark:border-slate-800 rounded-xl p-3.5 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-sky-700 dark:text-slate-400 text-xs mb-1 font-bold">
            <span>COLD Leads</span>
            <Snowflake className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-700 dark:text-slate-300">{stats.cold}</div>
          <span className="text-[10px] text-sky-800 dark:text-slate-500 font-medium">Unresponsive / &lt;2 slots</span>
        </div>

        {/* REACH AGAIN / CALLBACK */}
        <div
          onClick={() => onNavigateToLeads('REACH_AGAIN')}
          className="bg-cyan-50/80 dark:bg-cyan-950/20 hover:bg-cyan-100 dark:hover:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/30 rounded-xl p-3.5 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400 text-xs mb-1 font-bold">
            <span>Reach Again</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-700 dark:text-cyan-400">{stats.reachAgain}</div>
          <span className="text-[10px] text-cyan-800 dark:text-cyan-300/70 font-medium">Callback requested</span>
        </div>

        {/* OPT-OUT */}
        <div
          onClick={() => onNavigateToLeads('OPT_OUT')}
          className="bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3.5 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs mb-1 font-bold">
            <span>OPT-OUT (DNC)</span>
            <ShieldBan className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400">{stats.optOut}</div>
          <span className="text-[10px] text-rose-800 dark:text-rose-300/70 font-medium">Do Not Call enforced</span>
        </div>
      </div>
    </div>
  );
};

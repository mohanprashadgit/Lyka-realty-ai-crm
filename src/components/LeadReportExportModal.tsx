import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Code2,
  Calendar,
  Search,
  Flame,
  SunMedium,
  Snowflake,
  Filter,
  CheckCircle,
  Download,
} from 'lucide-react';
import { CallRecord } from '../types/agent';
import {
  filterCallRecords,
  exportToExcelCsv,
  exportToJson,
  generatePrintablePdfReport,
} from '../utils/exportReport';

interface LeadReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  calls: CallRecord[];
}

export const LeadReportExportModal: React.FC<LeadReportExportModalProps> = ({
  isOpen,
  onClose,
  calls,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [searchName, setSearchName] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');

  if (!isOpen) return null;

  // Extract unique dates from calls
  const availableDates = Array.from(
    new Set(
      calls
        .map((c) => (c.startedAt ? c.startedAt.slice(0, 10) : ''))
        .filter(Boolean)
    )
  ).sort().reverse();

  const filteredCalls = filterCallRecords(calls, {
    date: selectedDate,
    customerName: searchName,
    outcome: selectedOutcome,
  });

  const hotCount = filteredCalls.filter((c) => c.outcome === 'HOT').length;
  const warmCount = filteredCalls.filter((c) => c.outcome === 'WARM').length;
  const coldCount = filteredCalls.filter((c) => c.outcome === 'COLD').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Export Customer Leads & Call Data
              </h3>
              <p className="text-[11px] text-slate-400">
                Excel (.csv), Printable PDF, and JSON based on Date & Customer details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filter Criteria</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Filter */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Select Specific Date:</span>
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Recorded Dates ({calls.length} calls)</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Name Search */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                <Search className="w-3 h-3 text-slate-400" />
                <span>Customer Name / Phone:</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or number..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Outcome Quick Chips */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Lead Qualification Classification:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All Leads' },
                { id: 'HOT', label: '🔥 HOT Only', color: 'text-rose-400 border-rose-500/30' },
                { id: 'WARM', label: '☀️ WARM Only', color: 'text-amber-400 border-amber-500/30' },
                { id: 'COLD', label: '❄️ COLD Only', color: 'text-sky-400 border-sky-500/30' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedOutcome(chip.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    selectedOutcome === chip.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-semibold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtered Summary Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Matching Records:{' '}
              <strong className="text-slate-100 font-mono text-sm">{filteredCalls.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                🔥 {hotCount} HOT
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                ☀️ {warmCount} WARM
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">
                ❄️ {coldCount} COLD
              </span>
            </div>
          </div>
        </div>

        {/* 3 Export Action Buttons */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300">Choose Export Format:</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Option 1: Excel CSV */}
            <button
              onClick={() => {
                const dateTag = selectedDate !== 'ALL' ? selectedDate : 'all-dates';
                exportToExcelCsv(filteredCalls, `chennai_leads_${dateTag}.csv`);
              }}
              disabled={filteredCalls.length === 0}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center group"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-100">Excel Spreadsheet</span>
              <span className="text-[10px] text-emerald-400/80 mt-0.5">.CSV for Excel/Sheets</span>
            </button>

            {/* Option 2: PDF Report */}
            <button
              onClick={() => {
                generatePrintablePdfReport(filteredCalls, {
                  date: selectedDate,
                  customerName: searchName,
                  outcome: selectedOutcome,
                });
              }}
              disabled={filteredCalls.length === 0}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/40 text-sky-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center group"
            >
              <FileText className="w-5 h-5 text-sky-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-100">Executive PDF</span>
              <span className="text-[10px] text-sky-400/80 mt-0.5">Print / Save as PDF</span>
            </button>

            {/* Option 3: JSON Data */}
            <button
              onClick={() => {
                const dateTag = selectedDate !== 'ALL' ? selectedDate : 'all-dates';
                exportToJson(filteredCalls, `chennai_leads_${dateTag}.json`);
              }}
              disabled={filteredCalls.length === 0}
              className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-center group"
            >
              <Code2 className="w-5 h-5 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-100">Raw JSON</span>
              <span className="text-[10px] text-purple-400/80 mt-0.5">Complete Stated Details</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

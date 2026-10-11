import React, { useState } from 'react';
import {
  Calendar,
  Flame,
  SunMedium,
  Snowflake,
  TrendingUp,
  Clock,
  User,
  Phone,
  CheckCircle,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { CallRecord } from '../types/agent';
import { computeStatsForDate } from '../storage/calls';

interface DateLeadVisualizationProps {
  calls: CallRecord[];
  onOpenExportReport: () => void;
  onSelectCallRecord?: (call: CallRecord) => void;
}

export const DateLeadVisualization: React.FC<DateLeadVisualizationProps> = ({
  calls,
  onOpenExportReport,
  onSelectCallRecord,
}) => {
  // Unique dates from calls
  const availableDates = Array.from(
    new Set(
      calls
        .map((c) => (c.startedAt ? c.startedAt.slice(0, 10) : ''))
        .filter(Boolean)
    )
  ).sort().reverse();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates.includes(todayStr) ? todayStr : availableDates[0] || 'ALL'
  );

  const dateStats = computeStatsForDate(calls, selectedDate);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Date-Wise Lead Qualification Analytics</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real HOT, WARM, and COLD distribution extracted from customer spoken JSON details
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Chips */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedDate('ALL')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedDate === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Dates
            </button>
            {todayStr && (
              <button
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today
              </button>
            )}
          </div>

          {/* Specific Date Dropdown */}
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">📅 All Dates ({calls.length} Total)</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  📅 {date} ({calls.filter((c) => c.startedAt?.startsWith(date)).length} calls)
                </option>
              ))}
            </select>
          </div>

          {/* Export Report Trigger */}
          <button
            onClick={onOpenExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel / PDF</span>
          </button>
        </div>
      </div>

      {/* 3 Qualification Metric Cards for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* HOT Card */}
        <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-1.5 font-bold">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span>HOT Leads</span>
            </div>
            <span className="font-mono text-sm font-bold">{dateStats.hotPercentage}%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300">
            {dateStats.hot}{' '}
            <span className="text-xs font-medium text-rose-600/80 dark:text-rose-400/80">
              / {dateStats.totalCallsOnDate} calls
            </span>
          </div>
          <div className="w-full bg-rose-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${dateStats.hotPercentage}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-rose-800 dark:text-rose-300/80 leading-tight">
            High intent &bull; Stated budget &bull; Timeline &lt; 3 months
          </p>
        </div>

        {/* WARM Card */}
        <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <div className="flex items-center gap-1.5 font-bold">
              <SunMedium className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>WARM Leads</span>
            </div>
            <span className="font-mono text-sm font-bold">{dateStats.warmPercentage}%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
            {dateStats.warm}{' '}
            <span className="text-xs font-medium text-amber-600/80 dark:text-amber-400/80">
              / {dateStats.totalCallsOnDate} calls
            </span>
          </div>
          <div className="w-full bg-amber-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${dateStats.warmPercentage}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300/80 leading-tight">
            Interested buyer &bull; Timeline 3-6 months &bull; Flexible budget
          </p>
        </div>

        {/* COLD Card */}
        <div className="bg-sky-50/80 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-sky-600 dark:text-sky-400">
            <div className="flex items-center gap-1.5 font-bold">
              <Snowflake className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>COLD Leads</span>
            </div>
            <span className="font-mono text-sm font-bold">{dateStats.coldPercentage}%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-300">
            {dateStats.cold}{' '}
            <span className="text-xs font-medium text-sky-600/80 dark:text-sky-400/80">
              / {dateStats.totalCallsOnDate} calls
            </span>
          </div>
          <div className="w-full bg-sky-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${dateStats.coldPercentage}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-sky-800 dark:text-sky-300/80 leading-tight">
            Casually browsing &bull; No timeline or budget &bull; Passive response
          </p>
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      {dateStats.totalCallsOnDate > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium">Qualification Ratio ({selectedDate === 'ALL' ? 'All Dates' : selectedDate}):</span>
            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
              {dateStats.hot} Hot &bull; {dateStats.warm} Warm &bull; {dateStats.cold} Cold
            </span>
          </div>
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-300 dark:border-slate-800">
            {dateStats.hotPercentage > 0 && (
              <div
                title={`HOT: ${dateStats.hotPercentage}%`}
                className="bg-rose-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${dateStats.hotPercentage}%` }}
              />
            )}
            {dateStats.warmPercentage > 0 && (
              <div
                title={`WARM: ${dateStats.warmPercentage}%`}
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${dateStats.warmPercentage}%` }}
              />
            )}
            {dateStats.coldPercentage > 0 && (
              <div
                title={`COLD: ${dateStats.coldPercentage}%`}
                className="bg-sky-500 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${dateStats.coldPercentage}%` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Call Records for Selected Date */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Customer Stated Details for {selectedDate === 'ALL' ? 'All Dates' : selectedDate} ({dateStats.calls.length}):
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Based on conversation transcript slots
          </span>
        </div>

        {dateStats.calls.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            No calls recorded for this date. Run a test call to see real-time qualification analytics.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {dateStats.calls.map((call) => {
              const isHot = call.outcome === 'HOT';
              const isWarm = call.outcome === 'WARM';
              const borderClass = isHot
                ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/10'
                : isWarm
                ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/10'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60';

              const badgeColor = isHot
                ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                : isWarm
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                : 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30';

              return (
                <div
                  key={call.callId}
                  onClick={() => onSelectCallRecord?.(call)}
                  className={`p-3 rounded-xl border ${borderClass} hover:border-slate-400 dark:hover:border-slate-700 transition-all text-xs space-y-2 cursor-pointer shadow-xs`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{call.leadName}</span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{call.leadPhone}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                      {call.outcome || 'COLD'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Budget:</span>{' '}
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{call.budget || 'Not stated'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Type:</span>{' '}
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">{call.propertyType || 'Apartment'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Location:</span>{' '}
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">{call.location || 'Chennai'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Timeline:</span>{' '}
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">{call.timeline || 'Exploring'}</span>
                    </div>
                  </div>

                  {call.summary && (
                    <p className="text-[11px] text-slate-700 dark:text-slate-400 italic line-clamp-2 font-medium">
                      "{call.summary}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

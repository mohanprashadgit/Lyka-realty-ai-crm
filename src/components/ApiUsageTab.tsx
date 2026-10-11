import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Mic,
  Volume2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { ApiUsageData } from '../types/agent';

interface ApiUsageTabProps {
  usageData: ApiUsageData | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const ApiUsageTab: React.FC<ApiUsageTabProps> = ({
  usageData,
  onRefresh,
  isLoading,
}) => {
  // Live ticking countdown timer
  const [secondsUntilDaily, setSecondsUntilDaily] = useState<number>(
    usageData?.daily.secondsUntilRefill ?? 0
  );
  const [secondsUntilMinute, setSecondsUntilMinute] = useState<number>(
    usageData?.rateLimit.secondsUntilMinuteRefill ?? 60
  );

  useEffect(() => {
    if (usageData) {
      setSecondsUntilDaily(usageData.daily.secondsUntilRefill);
      setSecondsUntilMinute(usageData.rateLimit.secondsUntilMinuteRefill);
    }
  }, [usageData]);

  // Decrement seconds every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilDaily((prev) => (prev > 0 ? prev - 1 : 86400));
      setSecondsUntilMinute((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getStatusColor = (status?: string) => {
    if (status === 'EXHAUSTED') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (status === 'WARNING') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const dailyRemaining = usageData?.daily.remaining ?? 1500;
  const dailyLimit = usageData?.daily.limit ?? 1500;
  const dailyUsed = usageData?.daily.used ?? 0;
  const percentUsed = usageData?.daily.percentUsed ?? 0;
  const minuteRemaining = usageData?.rateLimit.remainingThisMinute ?? 15;
  const minuteLimit = usageData?.rateLimit.minuteLimit ?? 15;

  return (
    <div className="space-y-4">
      {/* Top Banner: Status & Live Refill Timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Gemini API Usage &amp; Quota Refill
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                  usageData?.quotaStatus
                )}`}
              >
                {usageData?.quotaStatus || 'HEALTHY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>Model: <code className="text-amber-300 font-mono text-[11px]">{usageData?.model || 'gemini-3.8-live'}</code></span>
              <span>•</span>
              <span>Tier: {usageData?.tier || 'Developer API'}</span>
            </p>
          </div>
        </div>

        {/* Live Daily Refill Countdown & Refresh */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Daily Quota Refill In:</span>
            </div>
            <div className="text-sm font-bold font-mono text-cyan-300">
              {formatCountdown(secondsUntilDaily)}
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Quota Status"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Metric Cards: Daily Quota, Minute Rate Limit, Audio Minutes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Daily Requests (RPD) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Daily Requests (RPD)</span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {dailyRemaining.toLocaleString()} remaining
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {dailyRemaining.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">of {dailyLimit.toLocaleString()} / day</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(2, percentUsed))}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Used today: <strong className="text-slate-200">{dailyUsed}</strong></span>
            <span>Refills at 00:00 UTC</span>
          </div>
        </div>

        {/* Card 2: Per-Minute Limit (RPM) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Minute Limit (RPM)</span>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {minuteRemaining} / {minuteLimit} RPM
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {minuteRemaining}
              </span>
              <span className="text-xs text-slate-400">available now</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(5, (minuteRemaining / minuteLimit) * 100))}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Rolling 60s window</span>
            <span className="text-cyan-400 font-mono">Refills in {secondsUntilMinute}s</span>
          </div>
        </div>

        {/* Card 3: Total Audio Streamed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Audio Streamed</span>
            <span className="text-[11px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Gemini Live Native
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100 font-mono">
                {usageData?.activity.totalAudioMinutesStreamed ?? '0.00'}
              </span>
              <span className="text-xs text-slate-400">minutes total</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-950 px-2 py-1 rounded text-[11px] text-slate-300 flex items-center gap-1">
                <Mic className="w-3 h-3 text-cyan-400" />
                <span>In: {usageData?.activity.audioSecondsSent ?? 0}s</span>
              </div>
              <div className="bg-slate-950 px-2 py-1 rounded text-[11px] text-slate-300 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Out: {usageData?.activity.audioSecondsReceived ?? 0}s</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Sessions: <strong className="text-slate-200">{usageData?.activity.totalSessions ?? 0}</strong></span>
            <span>Turns: <strong className="text-slate-200">{usageData?.activity.totalTurns ?? 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Quota Refill Policy & Details Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Gemini API Quota &amp; Refill Schedule Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Daily Quota (Requests Per Day)</span>
              <span className="font-mono text-emerald-400 font-semibold">{dailyLimit.toLocaleString()} RPD</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Google Gemini automatically refills your daily requests to <strong>1,500 requests</strong> every midnight at <strong>00:00:00 UTC</strong> (Coordinated Universal Time).
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 font-mono">
              <span className="text-slate-400">Next Refill Time:</span>
              <span className="text-cyan-300 font-semibold">
                {usageData?.daily.nextRefillIso
                  ? new Date(usageData.daily.nextRefillIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC'
                  : '00:00 UTC'}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Minute Rate Limit (RPM &amp; TPM)</span>
              <span className="font-mono text-cyan-400 font-semibold">{minuteLimit} RPM</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Gemini operates on a rolling 60-second window. Every minute, your available request capacity resets up to <strong>15 requests per minute</strong> and up to <strong>1,000,000 tokens per minute</strong>.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 font-mono">
              <span className="text-slate-400">Minute Reset:</span>
              <span className="text-cyan-300 font-semibold">In {secondsUntilMinute} seconds</span>
            </div>
          </div>
        </div>

        {/* Activity & Performance Breakdown */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400">Total API Requests</div>
            <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
              {usageData?.activity.totalRequestsAllTime ?? 0}
            </div>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400">Conversations Initiated</div>
            <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
              {usageData?.activity.totalSessions ?? 0}
            </div>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400">Dialogue Turns Handled</div>
            <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
              {usageData?.activity.totalTurns ?? 0}
            </div>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
            <div className="text-[11px] text-slate-400">Lead CRM Tool Updates</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
              {usageData?.activity.totalToolCalls ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

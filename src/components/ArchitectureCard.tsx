import React from 'react';
import { Cpu, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const ArchitectureCard: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-slate-100">
            Upgraded Architecture: Gemini Live
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Native Audio
        </span>
      </div>

      {/* Pipeline Diagram */}
      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
        <div className="text-[11px] font-medium text-slate-400">
          Real-Time Audio Pipeline:
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
            Mic (16kHz PCM)
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
            WebSocket / WebRTC Bridge
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
            Gemini Live (gemini-3.8-live)
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
            Speaker (24kHz Native PCM)
          </span>
        </div>
      </div>

      {/* Comparison checklist */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-start gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>Ollama &amp; Kokoro replaced by Gemini Live</span>
        </div>
        <div className="flex items-start gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>Native human emotion, pauses &amp; tone</span>
        </div>
        <div className="flex items-start gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>Sub-500ms conversation latency</span>
        </div>
        <div className="flex items-start gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>Hardware echo-cancellation &amp; barge-in</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          API key strictly server-side
        </span>
        <span className="text-amber-400/90 font-mono">Free-tier supported model</span>
      </div>
    </div>
  );
};

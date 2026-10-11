import React from 'react';
import { CheckCircle2, Circle, Target, ArrowRight } from 'lucide-react';
import { LeadData } from '../types/agent';

interface StageTrackerProps {
  lead: LeadData;
}

const STAGES = [
  {
    num: 1,
    id: 'interest',
    title: 'Interest',
    titleTa: 'ஆர்வம்',
    question: 'Buying, Selling, or Investing?',
    field: (l: LeadData) => l.interest,
  },
  {
    num: 2,
    id: 'buyer_type',
    title: 'Buyer Type',
    titleTa: 'வாங்குபவர்',
    question: 'First-time, Upgrading, or Investor?',
    field: (l: LeadData) => l.buyer_type,
  },
  {
    num: 3,
    id: 'property_type',
    title: 'Property Type',
    titleTa: 'சொத்து வகை',
    question: 'Apartment, Villa, 3BHK, etc.?',
    field: (l: LeadData) => l.property_type,
  },
  {
    num: 4,
    id: 'budget_location',
    title: 'Budget & Location',
    titleTa: 'பட்ஜெட் & இடம்',
    question: 'Target price & neighborhood?',
    field: (l: LeadData) => (l.budget ? `${l.budget}${l.location ? ` in ${l.location}` : ''}` : l.location),
  },
  {
    num: 5,
    id: 'timeline',
    title: 'Timeline',
    titleTa: 'கால அவகாசம்',
    question: 'Immediate, 1-3 mo, or exploring?',
    field: (l: LeadData) => l.timeline,
  },
];

export const StageTracker: React.FC<StageTrackerProps> = ({ lead }) => {
  // Count how many stages have data
  const completedCount = STAGES.filter((s) => Boolean(s.field(lead))).length;
  const progressPct = Math.round((completedCount / 5) * 100);

  // Determine current active stage (first incomplete stage, or 5 if all done)
  let currentStageIndex = STAGES.findIndex((s) => !s.field(lead));
  if (currentStageIndex === -1) currentStageIndex = 4;
  const currentStageNum = currentStageIndex + 1;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            5-Stage Lead Qualification
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Stage <strong className="text-amber-400">{completedCount === 5 ? '5/5 (Completed)' : `${currentStageNum}/5`}</strong>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 5 Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {STAGES.map((s, idx) => {
          const val = s.field(lead);
          const isDone = Boolean(val);
          const isCurrent = idx === currentStageIndex && !isDone;

          return (
            <div
              key={s.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : isCurrent
                  ? 'bg-amber-950/25 border-amber-500/40 ring-1 ring-amber-500/20 shadow-md'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Stage {s.num}</span>
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>

              <div className="text-xs font-medium text-slate-200 truncate flex items-center justify-between">
                <span>{s.title}</span>
                <span className="text-[10px] text-slate-400 font-normal">{s.titleTa}</span>
              </div>

              {isDone ? (
                <div className="text-[11px] text-emerald-400 font-medium truncate mt-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {val}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 truncate mt-1">
                  {s.question}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

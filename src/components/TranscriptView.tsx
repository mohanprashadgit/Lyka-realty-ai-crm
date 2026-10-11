import React, { useEffect, useRef } from 'react';
import { Volume2, User, Sparkles, Radio, MessageSquare } from 'lucide-react';
import { TranscriptTurn } from '../types/agent';

interface TranscriptViewProps {
  turns: TranscriptTurn[];
  isAgentSpeaking: boolean;
  agentAudioEnergy: number;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  turns,
  isAgentSpeaking,
  agentAudioEnergy,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            Real-Time Conversation Transcript
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isAgentSpeaking && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <span className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce" style={{ height: `${Math.max(30, agentAudioEnergy * 100)}%` }} />
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce delay-75" style={{ height: `${Math.max(40, agentAudioEnergy * 100)}%` }} />
                <span className="w-1 bg-emerald-400 rounded-full animate-bounce delay-150" style={{ height: `${Math.max(20, agentAudioEnergy * 100)}%` }} />
              </span>
              <span>Audio Active</span>
            </div>
          )}
          <span className="text-xs text-slate-500">
            {turns.length} {turns.length === 1 ? 'Turn' : 'Turns'}
          </span>
        </div>
      </div>

      {/* Transcript Scroll Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-[280px] max-h-[460px]">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-amber-400/60" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Ready to start qualification call
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Press "Start Call" below. Lyka executive will initiate with greeting via Gemini Live native audio.
            </p>
          </div>
        ) : (
          turns.map((turn) => {
            const isAgent = turn.role === 'agent';
            const isSystem = turn.role === 'system';

            if (isSystem) {
              return (
                <div key={turn.id} className="flex justify-center my-2">
                  <div className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-amber-400" />
                    <span>{turn.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={turn.id}
                className={`flex gap-3 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                    isAgent
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {isAgent ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-cyan-400" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isAgent
                      ? 'bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-800/90 dark:text-slate-100 dark:border-slate-700/80 rounded-tl-sm shadow-xs'
                      : 'bg-cyan-50 text-cyan-950 border border-cyan-200 dark:bg-cyan-950/40 dark:text-slate-100 dark:border-cyan-600/30 rounded-tr-sm shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className={`font-bold ${isAgent ? 'text-amber-700 dark:text-amber-400' : 'text-cyan-700 dark:text-cyan-400'}`}>
                      {isAgent ? 'Senior Executive' : 'Prospect (You)'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {turn.interrupted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Barge-in
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{turn.timestamp}</span>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap">{turn.text}</p>
                  {turn.isStreaming && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400/80 mt-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Speaking...
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollEndRef} />
      </div>
    </div>
  );
};

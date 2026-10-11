import React from 'react';
import {
  PhoneCall,
  PhoneOff,
  Radio,
  User,
  Clock,
  Sparkles,
  MapPin,
  Coins,
  Building,
  Hourglass,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { CallStatus, LeadRecord, LeadData, TranscriptTurn } from '../types/agent';
import { getAgentPersona } from '../types/agent';

interface LiveConnectInspectorProps {
  callStatus: CallStatus;
  callDuration: number;
  activeLead: LeadRecord | null;
  leadData: LeadData;
  turns: TranscriptTurn[];
  genderVoice: 'female' | 'male';
  selectedLanguage: string;
  onNavigateToCallScreen: () => void;
  onStartCall: (lead: LeadRecord) => void;
  onEndCall: () => void;
  leads: LeadRecord[];
}

export const LiveConnectInspector: React.FC<LiveConnectInspectorProps> = ({
  callStatus,
  callDuration,
  activeLead,
  leadData,
  turns,
  genderVoice,
  selectedLanguage,
  onNavigateToCallScreen,
  onStartCall,
  onEndCall,
  leads,
}) => {
  const isConnected =
    callStatus === 'connected' ||
    callStatus === 'speaking' ||
    callStatus === 'listening' ||
    callStatus === 'interrupted';

  const isConnecting = callStatus === 'connecting';
  const persona = getAgentPersona(genderVoice, selectedLanguage);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Top lead to call if no active lead
  const topCandidate = activeLead || leads.find((l) => l.callStatus === 'NOT_CALLED') || leads[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Title & Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Radio className={`w-4 h-4 ${isConnected ? 'animate-pulse text-emerald-400' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Live Connect Inspector</span>
              {isConnected ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CONNECTED LIVE
                </span>
              ) : isConnecting ? (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  DIALING...
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  STANDBY
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time connected customer details & spoken history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button
                onClick={onNavigateToCallScreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-sm"
              >
                <span>View Full Call Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onEndCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Call</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (topCandidate) onStartCall(topCandidate);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-98"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Connect Now ({topCandidate?.name || 'Prospect'})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Connect Grid */}
      {isConnected && activeLead ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Left Column: Who is Connected & Real-Time Extracted Stated Details */}
          <div className="md:col-span-5 space-y-3">
            {/* Prospect Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Connected Customer:</span>
                <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(callDuration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs">
                  {activeLead.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">{activeLead.name}</div>
                  <div className="text-xs font-mono text-slate-400">{activeLead.phone}</div>
                </div>
              </div>

              {/* Assigned Persona */}
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Assigned Executive:</span>
                <span className="font-semibold text-amber-400">
                  {persona.name} ({persona.gender === 'female' ? '👩' : '👨'} {selectedLanguage})
                </span>
              </div>
            </div>

            {/* Extracted Stated Requirements JSON */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>What Customer Stated (Live JSON Slots):</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    leadData.qualification_status === 'HOT'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : leadData.qualification_status === 'WARM'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  }`}
                >
                  {leadData.qualification_status}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Budget:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{leadData.budget || 'Listening...'}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Building className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Property:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{leadData.property_type || 'Listening...'}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Location:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{leadData.location || 'Listening...'}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Hourglass className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Timeline:
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{leadData.timeline || 'Listening...'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Conversation History / What They Told */}
          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Live Conversation History (What They Told):
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Live Stream
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {turns.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400 italic">
                    Connected. Waiting for initial speech...
                  </div>
                ) : (
                  turns.map((turn) => {
                    const isUser = turn.role === 'user';
                    return (
                      <div
                        key={turn.id}
                        className={`p-2.5 rounded-lg text-xs space-y-0.5 ${
                          isUser
                            ? 'bg-amber-50 border border-amber-200 text-amber-950 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200 ml-4'
                            : 'bg-slate-100 border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold">
                            {isUser ? `👤 ${activeLead.name}` : `👩 ${persona.name} (Executive)`}
                          </span>
                          <span className="font-mono">{turn.timestamp}</span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium">{turn.text}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{turns.length} dialogue turns recorded</span>
              <button
                onClick={onNavigateToCallScreen}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
              >
                Open Audio Waveform & Barge-In &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standby State */
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>Ready for Outbound Prospect Connection</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Next lead in line:{' '}
              <strong className="text-slate-200">{topCandidate?.name || 'Mohan Prashad'}</strong> (
              {topCandidate?.phone || '+919944406813'})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (topCandidate) onStartCall(topCandidate);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Connect Call</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

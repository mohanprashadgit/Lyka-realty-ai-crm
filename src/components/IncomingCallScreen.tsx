import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Building2,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Wifi,
  Battery,
  Volume2,
  CornerDownLeft,
} from 'lucide-react';
import { LeadRecord, getAgentPersona } from '../types/agent';
import { PhoneRingtone } from '../utils/audio';

interface IncomingCallScreenProps {
  lead: LeadRecord;
  genderVoice: 'female' | 'male';
  selectedLanguage: string;
  onAccept: () => void;
  onDecline: (reason: 'declined' | 'timeout') => void;
}

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({
  lead,
  genderVoice,
  selectedLanguage,
  onAccept,
  onDecline,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const ringtoneRef = useRef<PhoneRingtone | null>(null);
  const persona = getAgentPersona(genderVoice, selectedLanguage);

  const handlePickUp = useCallback(() => {
    ringtoneRef.current?.stop();
    onAccept();
  }, [onAccept]);

  const handleReject = useCallback(() => {
    ringtoneRef.current?.stop();
    onDecline('declined');
  }, [onDecline]);

  // Global Keyboard Listener: Press Enter to answer call immediately, Escape to decline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePickUp();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleReject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePickUp, handleReject]);

  useEffect(() => {
    // Start synthesizing realistic Vivo smartphone ringtone
    const ringtone = new PhoneRingtone();
    ringtoneRef.current = ringtone;
    ringtone.start();

    // 10-second countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          ringtone.stop();
          onDecline('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      ringtone.stop();
    };
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      {/* Vivo-Style Luxury Smartphone Mockup Chassis */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[780px] bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-[42px] border-[5px] border-slate-700/80 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between text-white select-none">
        {/* Phone Speaker & Camera Notch */}
        <div className="absolute top-0 inset-x-0 flex justify-center items-center pt-2.5 z-20">
          <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-2 border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* Top Status Bar (Vivo Funtouch / OriginOS Style) */}
        <div className="pt-4 px-6 flex items-center justify-between text-[11px] text-slate-400 font-medium z-10">
          <span className="font-semibold text-slate-200">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">5G</span>
            <Wifi className="w-3 h-3 text-slate-300" />
            <div className="flex items-center gap-0.5 text-slate-300">
              <span className="text-[10px] font-mono">92%</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Caller Info & Ambient Rings */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3.5 z-10 pt-2">
          {/* Top Calling Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Vivo Outbound Smart Call</span>
          </div>

          {/* Lead Name (Large Primary Focus) */}
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
              Calling Lead Prospect
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {lead.name}
            </h1>
            <p className="text-sm font-mono text-amber-400 font-semibold">{lead.phone}</p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{lead.location || 'Chennai, Tamil Nadu'}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Consented
              </span>
            </div>
          </div>

          {/* Animated Glowing Ring & Avatar Logo (Click/Press Logo to Answer) */}
          <div
            onClick={handlePickUp}
            role="button"
            tabIndex={0}
            title="Click Logo or Press Enter to Answer Call"
            className="relative flex flex-col items-center justify-center my-1 cursor-pointer group select-none active:scale-95 transition-transform"
          >
            {/* Pulsing Acoustic Rings */}
            <div className="absolute w-36 h-36 rounded-full bg-emerald-500/25 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute w-48 h-48 rounded-full bg-amber-500/15 animate-pulse pointer-events-none" />

            {/* Avatar Circle / Logo */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 p-1 shadow-2xl shadow-amber-500/30 group-hover:shadow-emerald-500/60 group-hover:scale-105 transition-all">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-2 border-slate-900 group-hover:border-emerald-400 transition-colors">
                <span className="text-3xl mb-0.5 group-hover:scale-115 transition-transform">
                  {persona.gender === 'female' ? '👩' : '👨'}
                </span>
                <span className="text-[9px] font-bold text-amber-400 group-hover:text-emerald-300 tracking-wider uppercase">
                  {persona.name}
                </span>
              </div>
            </div>

            {/* Quick Click Hint Tag */}
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold shadow-sm group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Click Logo to Answer</span>
            </div>
          </div>

          {/* Executive & Agency Info (Also Clickable to Answer) */}
          <div
            onClick={handlePickUp}
            role="button"
            tabIndex={0}
            title="Click to answer call (or press Enter)"
            className="w-full max-w-xs bg-slate-900/80 hover:bg-slate-850 hover:border-emerald-500/40 border border-slate-800 rounded-2xl p-2.5 text-xs space-y-1 backdrop-blur-sm shadow-inner cursor-pointer transition-all active:scale-98"
          >
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Lyka Realty</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Executive: <strong className="text-slate-200">{persona.name}</strong> ({selectedLanguage.toUpperCase()})
            </p>
          </div>

          {/* 10-Second Pick-Up Countdown Meter */}
          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-400 animate-bounce" />
                <span>Vivo Ringtone Playing...</span>
              </span>
              <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {timeLeft}s left to pick
              </span>
            </div>
            {/* Animated Countdown Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 3 ? 'bg-rose-500' : timeLeft <= 6 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              If not answered in 10s, lead automatically moves to <strong className="text-slate-400">No Answer</strong> list.
            </p>
          </div>
        </div>

        {/* Vivo Mobile Call Answer / Decline Controls */}
        <div className="pb-8 pt-3 px-8 z-10 space-y-3">
          {/* Keyboard Enter Shortcut Pill */}
          <div className="flex justify-center">
            <button
              onClick={handlePickUp}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-[11px] text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <CornerDownLeft className="w-3 h-3 text-emerald-400" />
              <span>Press <strong className="text-emerald-400 font-mono">Enter ↵</strong> or tap logo to answer</span>
            </button>
          </div>

          <div className="flex items-center justify-around">
            {/* Decline / Reject Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleReject}
                title="Decline Call (Esc)"
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all cursor-pointer border border-rose-400/40"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-[11px] font-semibold text-rose-400">Decline (Esc)</span>
            </div>

            {/* Accept / Pick Up Call Button with Glowing Pulse */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping opacity-75" />
                <button
                  onClick={handlePickUp}
                  title="Pick Up Call (Enter)"
                  className="relative w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 transition-all cursor-pointer font-bold border-2 border-emerald-300"
                >
                  <PhoneCall className="w-7 h-7 text-slate-950 animate-pulse" />
                </button>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span>Answer (Enter)</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500">
            Swipe up, press <strong className="text-emerald-400 font-semibold">Enter</strong>, or tap <strong className="text-amber-400 font-semibold">Logo</strong> to take call with {persona.name}.
          </div>
        </div>

        {/* Bottom Vivo Navigation Pill Bar */}
        <div className="w-full flex justify-center pb-2">
          <div className="w-32 h-1 bg-slate-700/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};

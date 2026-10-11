import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Mic,
  Bluetooth,
  ChevronDown,
  Volume2,
  Download,
  Phone,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { CallStatus, AudioInputDeviceInfo, getAgentPersona } from '../types/agent';

interface HeaderProps {
  callStatus: CallStatus;
  callDuration: number;
  genderVoice: 'female' | 'male';
  onGenderVoiceChange: (gender: 'female' | 'male') => void;
  selectedLanguage: string;
  onLanguageChange: (langId: string) => void;
  selectedMicId: string;
  onMicChange: (deviceId: string) => void;
  availableMics: AudioInputDeviceInfo[];
  onOpenExport: () => void;
  onOpenTwilio?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  callStatus,
  callDuration,
  genderVoice,
  onGenderVoiceChange,
  selectedLanguage,
  onLanguageChange,
  selectedMicId,
  onMicChange,
  availableMics,
  onOpenExport,
  onOpenTwilio,
  theme = 'dark',
  onToggleTheme,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const currentMic = availableMics.find((m) => m.deviceId === selectedMicId);
  const isCallActive = callStatus !== 'idle' && callStatus !== 'ended' && callStatus !== 'error';

  // Resolve current active agent persona based on user's exact specification
  const currentPersona = getAgentPersona(genderVoice, selectedLanguage);

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    if (isDownloadingZip) return;
    setIsDownloadingZip(true);
    try {
      const response = await fetch('/api/download-zip');
      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chennai-real-estate-ai-voice-agent.zip';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 500);
    } catch (err) {
      console.error('[Download ZIP Error]:', err);
      // Fallback
      window.location.href = '/api/download-zip';
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-2.5 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Active Agent Persona Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-100 leading-tight">
                Lyka Realty
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Lyka Agent
              </span>
            </div>
            {/* Active Executive Name Display */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Executive:</span>
              <strong className="text-amber-400 font-semibold flex items-center gap-1">
                <span>{genderVoice === 'female' ? '👩' : '👨'}</span>
                <span>{currentPersona.name}</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Active Call Timer */}
          {isCallActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTime(callDuration)}</span>
            </div>
          )}

          {/* Voice Gender & Persona Toggle: Female / Male */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => onGenderVoiceChange('female')}
              disabled={isCallActive}
              title="Female Executive: Lyka"
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                genderVoice === 'female'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👩 Lyka
            </button>
            <button
              onClick={() => onGenderVoiceChange('male')}
              disabled={isCallActive}
              title={
                selectedLanguage === 'tamil'
                  ? 'Male Executive: Vinakya Mahadev (Spoken Tamil)'
                  : 'Male Executive: Stark'
              }
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                genderVoice === 'male'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👨 {selectedLanguage === 'tamil' ? 'Vinakya' : 'Stark'}
            </button>
          </div>

          {/* Language Selection: Tamil, English, Hindi, Arabic, Auto */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => onLanguageChange('tamil')}
              disabled={isCallActive}
              title="Tamil (தமிழ்) - Spoken by Lyka or Vinakya Mahadev"
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                selectedLanguage === 'tamil'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => onLanguageChange('english')}
              disabled={isCallActive}
              title="English - Spoken by Stella or Stark"
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                selectedLanguage === 'english'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('hindi')}
              disabled={isCallActive}
              title="Hindi (हिंदी)"
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                selectedLanguage === 'hindi'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => onLanguageChange('arabic')}
              disabled={isCallActive}
              title="Arabic (العربية)"
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                selectedLanguage === 'arabic'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => onLanguageChange('bilingual')}
              disabled={isCallActive}
              title="Auto-detect (Tamil + English)"
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                selectedLanguage === 'bilingual'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto
            </button>
          </div>

          {/* Mic Device Selector */}
          <div className="relative inline-block">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              {currentMic?.isBluetooth ? (
                <Bluetooth className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <select
              value={selectedMicId}
              onChange={(e) => onMicChange(e.target.value)}
              title="Select Microphone"
              className="appearance-none text-xs bg-slate-950 text-slate-200 pl-7 pr-6 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[130px] truncate"
            >
              {availableMics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId} className="bg-slate-900 text-slate-200">
                  {mic.isBluetooth ? '🎧 ' : '🎤 '}
                  {mic.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Twilio Outbound Real Call Setup */}
          {onOpenTwilio && (
            <button
              onClick={onOpenTwilio}
              title="Twilio Real Phone Calling (+17372508034)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Twilio Call</span>
            </button>
          )}

          {/* Download Codebase as ZIP Button */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            title="Download full project codebase as ZIP"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
          >
            <Download className={`w-3.5 h-3.5 ${isDownloadingZip ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingZip ? 'Downloading...' : 'Download ZIP'}</span>
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  X,
  Download,
  Github,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState('');
  const [repoUrl, setRepoUrl] = useState('https://github.com/mohanprashadgit/lyka-ai-voice-lead-agent');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleDownloadZip = () => {
    window.location.href = '/api/download-zip';
  };

  const handlePushGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setPushStatus('error');
      setStatusMessage('Please enter your GitHub Personal Access Token.');
      return;
    }

    try {
      setIsPushing(true);
      setPushStatus('idle');
      setStatusMessage('');

      const res = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), repoUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setPushStatus('success');
        setStatusMessage(data.message || 'Successfully pushed to your GitHub repository!');
      } else {
        setPushStatus('error');
        setStatusMessage(data.error || 'Failed to push to GitHub. Please check your token permissions.');
      }
    } catch (err: any) {
      setPushStatus('error');
      setStatusMessage(err.message || 'Network error pushing to GitHub.');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Download or Push Project
              </h3>
              <p className="text-[11px] text-slate-400">
                Lyka AI - Voice Lead Agent
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

        {/* Option 1: Direct ZIP Download */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Option 1: Instant ZIP Download
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              1-Click
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Download the entire clean source code as a compressed <code>.zip</code> file including all React components, backend proxy, documentation, and configuration.
          </p>

          <button
            onClick={handleDownloadZip}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/15 active:scale-98 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Project (.ZIP)</span>
          </button>
        </div>

        {/* Option 2: Push directly to GitHub */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Option 2: Push to GitHub Repo
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Direct Push
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Target Repository:{' '}
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 underline font-mono text-[10px] break-all inline-flex items-center gap-1 hover:text-amber-200"
            >
              <span>{repoUrl}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>

          <form onSubmit={handlePushGithub} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-400" />
                  GitHub Personal Access Token (PAT):
                </span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=Lyka+AI+Voice+Agent"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  Generate Token (repo scope)
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {pushStatus === 'success' && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <p className="font-semibold">{statusMessage}</p>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[11px] mt-0.5 inline-block text-emerald-200"
                  >
                    View repository on GitHub →
                  </a>
                </div>
              </div>
            )}

            {pushStatus === 'error' && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <p className="text-[11px] leading-tight break-all">{statusMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPushing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Github className="w-4 h-4 text-white" />
              <span>{isPushing ? 'Pushing to GitHub...' : 'Push to GitHub Repository'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * CrmHeader.tsx — Clean, Spacious Top Navigation Bar
 */
import React from 'react';
import { useCrm } from '../context/CrmContext';
import { CRM_MODULES } from '../types/crm';
import { RolePreviewSelector } from './RolePreviewSelector';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Bot,
  ExternalLink,
} from 'lucide-react';

export const CrmHeader: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    theme,
    toggleTheme,
    onOpenChatbot,
    notificationCount,
    setIsMobileSidebarOpen,
    globalSearch,
    setGlobalSearch,
  } = useCrm();

  const currentModule = CRM_MODULES.find(m => m.id === activeModule) || CRM_MODULES[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim() && activeModule !== 'leads' && activeModule !== 'customers') {
      setActiveModule('leads');
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`h-16 border-b px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 shrink-0 z-20 transition-colors backdrop-blur-md ${
        isDark
          ? 'border-[#28232D] bg-[#0B0A0C]/90'
          : 'border-[#E2D8D1] bg-[#FAF7F2]/90'
      }`}
    >
      {/* Left: Mobile Menu Toggle & Module Title */}
      <div className="flex items-center gap-3 min-w-0 shrink">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`md:hidden p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#141217] text-[#968a7e] hover:text-white'
              : 'border-[#E2D8D1] bg-white text-[#817568] hover:text-[#1c1b1e]'
          }`}
          title="Open Navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs uppercase tracking-wider text-[#d8a868] font-bold hidden sm:inline shrink-0">
            {currentModule.category === 'core' ? 'Main' : currentModule.category}
          </span>
          <span className="text-xs text-[#968a7e]/60 hidden sm:inline shrink-0">/</span>
          <h1
            className={`text-base sm:text-lg font-bold tracking-tight truncate ${
              isDark ? 'text-white' : 'text-[#1c1b1e]'
            }`}
          >
            {currentModule.name}
          </h1>
        </div>
      </div>

      {/* Right: Global Search, Theme, Notifications, Dev Role, AI Assistant */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden xl:block w-56 2xl:w-72 shrink-0">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search leads, clients, plots..."
            className={`w-full pl-9 pr-14 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#d8a868]/60 ${
              isDark
                ? 'border-[#28232D] bg-[#141217] text-white placeholder-[#968a7e]/60'
                : 'border-[#E2D8D1] bg-white text-[#1c1b1e] placeholder-[#817568]/60'
            }`}
          />
          <kbd
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              isDark
                ? 'border-[#28232D] bg-[#1c1a22] text-[#968a7e]'
                : 'border-[#E2D8D1] bg-[#f7f2f6] text-[#817568]'
            }`}
          >
            Ctrl K
          </kbd>
        </form>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#141217] text-[#968a7e] hover:text-white hover:border-[#d8a868]/40'
              : 'border-[#E2D8D1] bg-white text-[#817568] hover:text-[#1c1b1e] hover:border-[#d8a868]/60'
          }`}
          title={isDark ? 'Switch to Ivory Light Theme' : 'Switch to Graphite Dark Theme'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* In-app Notifications */}
        <button
          onClick={() => setActiveModule('notifications')}
          className={`relative p-2 rounded-xl border transition-colors shrink-0 cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#141217] text-[#968a7e] hover:text-white hover:border-[#d8a868]/40'
              : 'border-[#E2D8D1] bg-white text-[#817568] hover:text-[#1c1b1e] hover:border-[#d8a868]/60'
          }`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Development Role Preview Switcher */}
        <div className="shrink-0">
          <RolePreviewSelector />
        </div>

        {/* Client AI Chatbot & Voice Shortcut */}
        <button
          onClick={onOpenChatbot}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl border border-[#d8a868]/40 bg-[#d8a868]/15 hover:bg-[#d8a868]/25 text-[#f0be7c] text-xs font-bold transition-all shadow-sm shadow-[#d8a868]/10 shrink-0 whitespace-nowrap cursor-pointer"
          title="Return to AI Client Chatbot & Voice Screen"
        >
          <Bot className="w-4 h-4 text-[#d8a868] shrink-0" />
          <span className="hidden sm:inline">AI Assistant</span>
          <ExternalLink className="w-3 h-3 opacity-60 hidden sm:inline shrink-0" />
        </button>
      </div>
    </header>
  );
};

export default CrmHeader;

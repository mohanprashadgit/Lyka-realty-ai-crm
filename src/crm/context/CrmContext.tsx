/**
 * CrmContext.tsx — Shared state provider for Lyka Real Estate CRM
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CrmRole, CrmModuleId, DashboardKpis, DEV_ROLES, DevRoleInfo } from '../types/crm';

interface CrmContextType {
  activeModule: CrmModuleId;
  setActiveModule: (m: CrmModuleId) => void;
  activeRole: CrmRole;
  setActiveRole: (r: CrmRole) => void;
  activeRoleInfo: DevRoleInfo;
  kpis: DashboardKpis | null;
  isLoadingKpis: boolean;
  refreshDashboard: () => Promise<void>;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (o: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onOpenChatbot: () => void;
  notificationCount: number;
  // Modal & Drawer State
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  isAddLeadOpen: boolean;
  setIsAddLeadOpen: (o: boolean) => void;
  isAddCustomerOpen: boolean;
  setIsAddCustomerOpen: (o: boolean) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  employees: any[];
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

function getModuleFromHash(): CrmModuleId {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.toLowerCase();
  if (!hash.startsWith('#crm')) return 'overview';

  // Support #crm/module-name
  const parts = hash.split('?')[0].split('/');
  if (parts.length > 1 && parts[1]) {
    const candidate = parts[1] as CrmModuleId;
    const validModuleIds = [
      'overview', 'leads', 'customers', 'properties', 'land', 'ai-listing',
      'matching', 'pipeline', 'site-visits', 'tasks', 'deals', 'employees',
      'teams', 'performance', 'rewards', 'commissions', 'campaigns',
      'communications', 'reports', 'notifications', 'users', 'settings', 'audit-logs'
    ];
    if (validModuleIds.includes(candidate)) {
      return candidate;
    }
  }

  // Support #crm?module=module-name
  const match = hash.match(/[?&]module=([a-z0-9-]+)/i);
  if (match && match[1]) {
    return match[1].toLowerCase() as CrmModuleId;
  }

  return 'overview';
}

export function CrmProvider({
  children,
  onOpenChatbot,
  initialTheme = 'dark',
}: {
  children: React.ReactNode;
  onOpenChatbot: () => void;
  initialTheme?: 'dark' | 'light';
}) {
  const [activeModule, setActiveModuleState] = useState<CrmModuleId>(getModuleFromHash);
  const [activeRole, setActiveRole] = useState<CrmRole>('Super Admin');
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [isLoadingKpis, setIsLoadingKpis] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme);
  const [notificationCount, setNotificationCount] = useState(3);

  // Drawers and Modals
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  const activeRoleInfo = DEV_ROLES.find(r => r.role === activeRole) || DEV_ROLES[0];

  const setActiveModule = useCallback((m: CrmModuleId) => {
    setActiveModuleState(m);
    if (typeof window !== 'undefined') {
      const targetHash = m === 'overview' ? '#crm' : `#crm/${m}`;
      if (window.location.hash.toLowerCase() !== targetHash.toLowerCase()) {
        window.location.hash = targetHash;
      }
    }
  }, []);

  // Listen to external hash changes (e.g. browser back/forward or manual URL edit)
  useEffect(() => {
    const handleHashSync = () => {
      const mod = getModuleFromHash();
      setActiveModuleState(prev => (prev !== mod ? mod : prev));
    };
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsLoadingKpis(true);
    try {
      const res = await fetch('/api/crm/dashboard', {
        headers: { 'x-user-role': activeRole },
      });
      const data = await res.json();
      if (data.success && data.kpis) {
        setKpis(data.kpis);
      }
    } catch (err) {
      console.error('[CRM Context] Failed to fetch dashboard metrics:', err);
    } finally {
      setIsLoadingKpis(false);
    }
  }, [activeRole]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/employees', {
        headers: { 'x-user-role': activeRole },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
      }
    } catch (err) {
      console.error('[CRM Context] Failed to fetch employees:', err);
    }
  }, [activeRole]);

  useEffect(() => {
    refreshDashboard();
    fetchEmployees();
  }, [refreshDashboard, fetchEmployees]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <CrmContext.Provider
      value={{
        activeModule,
        setActiveModule,
        activeRole,
        setActiveRole,
        activeRoleInfo,
        kpis,
        isLoadingKpis,
        refreshDashboard,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        theme,
        toggleTheme,
        onOpenChatbot,
        notificationCount,
        selectedLeadId,
        setSelectedLeadId,
        selectedCustomerId,
        setSelectedCustomerId,
        isAddLeadOpen,
        setIsAddLeadOpen,
        isAddCustomerOpen,
        setIsAddCustomerOpen,
        globalSearch,
        setGlobalSearch,
        employees,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return ctx;
}

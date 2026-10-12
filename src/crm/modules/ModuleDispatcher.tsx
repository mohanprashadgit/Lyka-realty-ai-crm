/**
 * ModuleDispatcher.tsx — Renders the active module view with full Aura Privé styling
 * Every navigation item opens its intended, dedicated page.
 */
import React from 'react';
import { useCrm } from '../context/CrmContext';
import { OverviewDashboard } from './OverviewDashboard';
import { LeadManagementView } from './LeadManagementView';
import { CustomerManagementView } from './CustomerManagementView';
import { SalesPipelineView } from './SalesPipelineView';
import { PropertiesView } from './PropertiesView';
import { LandManagementView } from './LandManagementView';
import { DealsManagementView } from './DealsManagementView';
import { SiteVisitsView } from './SiteVisitsView';
import { TasksManagementView } from './TasksManagementView';
import { EmployeeManagementView } from './EmployeeManagementView';
import { TeamsManagementView } from './TeamsManagementView';
import { PerformanceRewardsView } from './PerformanceRewardsView';
import { CampaignsManagementView } from './CampaignsManagementView';
import { NotificationsView } from './NotificationsView';
import { SettingsView } from './SettingsView';
import { AuditLogsView } from './AuditLogsView';
import { UserManagementView } from './UserManagementView';
import { RoadmapModuleView } from './RoadmapModuleView';

export const ModuleDispatcher: React.FC = () => {
  const { activeModule } = useCrm();

  switch (activeModule) {
    case 'overview':
      return <OverviewDashboard />;
    case 'leads':
      return <LeadManagementView />;
    case 'customers':
      return <CustomerManagementView />;
    case 'properties':
      return <PropertiesView />;
    case 'land':
      return <LandManagementView />;
    case 'pipeline':
      return <SalesPipelineView />;
    case 'deals':
      return <DealsManagementView />;
    case 'site-visits':
      return <SiteVisitsView />;
    case 'tasks':
      return <TasksManagementView />;
    case 'employees':
      return <EmployeeManagementView />;
    case 'teams':
      return <TeamsManagementView />;
    case 'performance':
    case 'rewards':
      return <PerformanceRewardsView />;
    case 'campaigns':
      return <CampaignsManagementView />;
    case 'notifications':
      return <NotificationsView />;
    case 'settings':
      return <SettingsView />;
    case 'audit-logs':
      return <AuditLogsView />;
    case 'users':
      return <UserManagementView />;
    case 'matching':
    case 'ai-listing':
    case 'reports':
    case 'communications':
    case 'commissions':
    default:
      return <RoadmapModuleView moduleId={activeModule} />;
  }
};

export default ModuleDispatcher;

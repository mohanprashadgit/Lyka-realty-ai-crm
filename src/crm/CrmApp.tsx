/**
 * CrmApp.tsx — Entry point for the CRM Portal
 */
import React from 'react';
import { CrmProvider } from './context/CrmContext';
import { CrmLayout } from './components/CrmLayout';

export interface CrmAppProps {
  onOpenChatbot: () => void;
  initialTheme?: 'dark' | 'light';
}

export const CrmApp: React.FC<CrmAppProps> = ({ onOpenChatbot, initialTheme = 'dark' }) => {
  return (
    <CrmProvider onOpenChatbot={onOpenChatbot} initialTheme={initialTheme}>
      <CrmLayout />
    </CrmProvider>
  );
};

export default CrmApp;

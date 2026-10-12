/**
 * RoadmapModuleView.tsx — Transparent Milestone Roadmap State
 * For modules scheduled for subsequent milestones (Matching, AI Listing, Reports, Communications)
 * Strictly adheres to requirement: Never make a nonfunctional page appear complete.
 */
import React from 'react';
import { useCrm } from '../context/CrmContext';
import { CRM_MODULES, CrmModuleId } from '../types/crm';
import {
  Sparkles,
  GitCompare,
  BarChart3,
  MessageSquareText,
  Clock,
  Construction,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface RoadmapModuleViewProps {
  moduleId: CrmModuleId;
}

const MODULE_ROADMAP_INFO: Record<string, {
  milestone: string;
  expectedDelivery: string;
  architectureNotes: string[];
  plannedFeatures: string[];
}> = {
  matching: {
    milestone: 'Stage 3 (Next Release)',
    expectedDelivery: 'Requirement-to-Inventory Algorithmic Matcher',
    architectureNotes: [
      'Weighted multi-parameter scoring engine (Budget 35%, Location 30%, Bedrooms 20%, Amenities 15%)',
      'Database geospatial proximity queries for Chennai micro-markets (OMR, ECR, Anna Nagar, Guindy)',
      'Direct 1-click proposal sharing to prospect via WhatsApp & Email',
    ],
    plannedFeatures: [
      'Visual match confidence gauges (95% Match, 80% Match)',
      'Budget variance tolerance bands (±15% flexibility)',
      'Inventory suggestion cards with inline photo previews',
    ],
  },
  'ai-listing': {
    milestone: 'Stage 3 (Next Release)',
    expectedDelivery: 'Multi-Modal AI Property Ingestion',
    architectureNotes: [
      'Gemini 3.5 Flash structured tool calling parsing unformatted builder PDFs & WhatsApp brochures',
      'Automatic slot normalization for built-up area, carpet area, UDS, and pricing',
      'Human-in-the-loop review queue before publishing to active property inventory',
    ],
    plannedFeatures: [
      'Drag-and-drop brochure upload & OCR parser',
      'Field confidence inspector with side-by-side verification',
      '1-click export to live properties catalog',
    ],
  },
  reports: {
    milestone: 'Stage 4 (Upcoming)',
    expectedDelivery: 'Executive Analytics & Multi-Format Exporter',
    architectureNotes: [
      'Aggregated lead velocity analytics and conversion funnels by territory and agent',
      'Ad spend ROI attribution combining Meta Ads spend with closed won deals',
      'Server-side multi-format exporter generating signed PDF and Excel workbooks',
    ],
    plannedFeatures: [
      'Monthly revenue trend graphs and lost-deal post-mortem breakdown',
      'Brokerage commission statements and agent payout reconciliation',
      'Custom date range query filters with CSV download',
    ],
  },
  communications: {
    milestone: 'Stage 4 (Upcoming)',
    expectedDelivery: 'Omnichannel Communication Audit',
    architectureNotes: [
      'Unified dialogue timeline joining Gemini Live audio recordings and text chat turns',
      'Twilio PSTN call recordings playback bridge with synchronized transcript viewer',
      'WhatsApp message log audit connected to customer relationship profile',
    ],
    plannedFeatures: [
      'Audio waveform playback of past qualification calls',
      'Sentiment and engagement trajectory scoring across turns',
      'Agent manual call note logging and follow-up tagging',
    ],
  },
};

export const RoadmapModuleView: React.FC<RoadmapModuleViewProps> = ({ moduleId }) => {
  const { theme } = useCrm();
  const isDark = theme === 'dark';

  const meta = CRM_MODULES.find(m => m.id === moduleId) || CRM_MODULES[0];
  const info = MODULE_ROADMAP_INFO[moduleId] || {
    milestone: 'Stage 3 / 4 Roadmap',
    expectedDelivery: 'Planned Module Enhancement',
    architectureNotes: ['Scheduled for development in upcoming sprint'],
    plannedFeatures: ['Feature specifications under active technical design'],
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 animate-in fade-in duration-200">
      {/* ─── Roadmap Status Banner ───────────────────────────────────── */}
      <div className={`p-8 rounded-2xl border text-center transition-colors ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        <div className="w-14 h-14 rounded-2xl bg-[#d8a868]/15 border border-[#d8a868]/30 flex items-center justify-center text-[#d8a868] mx-auto mb-4">
          <Clock className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#d8a868]/15 text-[#d8a868] border border-[#d8a868]/30 mb-3">
          <Construction className="w-3.5 h-3.5" />
          <span>{info.milestone}</span>
        </div>

        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
          {meta.name}
        </h2>
        <p className={`text-sm mt-2 max-w-xl mx-auto ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
          {meta.description}
        </p>

        <div className={`mt-6 p-4 rounded-xl border inline-block text-left max-w-lg ${
          isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'
        }`}>
          <div className="text-xs font-bold text-[#d8a868] uppercase tracking-wider mb-1">
            Status Notice
          </div>
          <p className={`text-xs ${isDark ? 'text-[#c9c0b5]' : 'text-[#4f4539]'}`}>
            This module is genuinely in active technical design for <span className="font-semibold text-[#d8a868]">{info.milestone}</span>. To preserve data authenticity and prevent misleading mockups, empty placeholders are strictly avoided.
          </p>
        </div>
      </div>

      {/* ─── Architecture & Features Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className={`p-6 rounded-2xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#d8a868]" />
            <span>Technical Architecture</span>
          </h3>
          <ul className="space-y-2 text-xs text-[#968a7e]">
            {info.architectureNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#d8a868] shrink-0 font-bold">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
          <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Planned Capabilities</span>
          </h3>
          <ul className="space-y-2 text-xs text-[#968a7e]">
            {info.plannedFeatures.map((feat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 shrink-0 font-bold">✓</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModuleView;

/**
 * LeadDetailDrawer.tsx — Comprehensive Lead Side Drawer
 * Displays customer contact, requirements, temperature/status toggles,
 * employee assignment, AI conversation history, notes, follow-up scheduling, and activity timeline.
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Flame,
  SunMedium,
  Snowflake,
  User,
  CheckCircle,
  MessageSquare,
  Plus,
  Send,
  Building2,
  Banknote,
  GitCompare,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface LeadDetailDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

const PIPELINE_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'property matching',
  'site visit',
  'negotiation',
  'won',
  'lost',
];

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const { employees, refreshDashboard, setActiveModule, theme } = useCrm();
  const isDark = theme === 'dark';
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'conversation' | 'tasks' | 'notes'>('details');

  // Form states
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [followupTitle, setFollowupTitle] = useState('Call back regarding requirement');
  const [followupDate, setFollowupDate] = useState('');
  const [followupPriority, setFollowupPriority] = useState('medium');
  const [isSchedulingFollowup, setIsSchedulingFollowup] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setLead(data.data);
      }
    } catch (err) {
      console.error('[LeadDetailDrawer] Failed to fetch lead:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    } else {
      setLead(null);
    }
  }, [leadId]);

  if (!leadId) return null;

  const handleUpdateField = async (field: string, value: any) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        setLead((prev: any) => ({ ...prev, [field]: value }));
        refreshDashboard();
        if (onLeadUpdated) onLeadUpdated();
      }
    } catch (err) {
      console.error('[LeadDetailDrawer] Update failed:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote('');
        fetchLeadDetails();
      }
    } catch (err) {
      console.error('[LeadDetailDrawer] Add note error:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupDate) return;
    setIsSchedulingFollowup(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: followupTitle,
          due_date: followupDate,
          priority: followupPriority,
          assigned_to: lead?.assigned_agent || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowScheduleForm(false);
        fetchLeadDetails();
        refreshDashboard();
      }
    } catch (err) {
      console.error('[LeadDetailDrawer] Schedule follow-up error:', err);
    } finally {
      setIsSchedulingFollowup(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/crm/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_notes: 'Completed via Lead Drawer' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLeadDetails();
        refreshDashboard();
      }
    } catch (err) {
      console.error('[LeadDetailDrawer] Complete task error:', err);
    }
  };

  const formatCurrency = (min?: number, max?: number, curr = 'INR') => {
    const symbol = curr === 'INR' ? '₹' : curr + ' ';
    if (!min && !max) return 'Not stated';
    const val = max || min || 0;
    if (val >= 10000000) return `${symbol}${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${symbol}${(val / 100000).toFixed(2)} Lakh`;
    return `${symbol}${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div
        className={`relative w-full max-w-2xl border-l shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200 transition-colors ${
          isDark
            ? 'bg-[#141217] border-[#28232D] text-[#e6e1e5]'
            : 'bg-white border-[#E2D8D1] text-[#1c1b1e]'
        }`}
      >
        {/* Top Header */}
        <div
          className={`p-5 border-b flex items-start justify-between gap-4 transition-colors ${
            isDark
              ? 'border-[#28232D] bg-[#18161B]'
              : 'border-[#E2D8D1] bg-[#FAF7F2]'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#28232D] text-[#d8a868] font-bold">
                #{leadId.slice(0, 8)}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-flex items-center gap-1 ${
                  lead?.temperature === 'HOT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : lead?.temperature === 'WARM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}
              >
                {lead?.temperature === 'HOT' && <Flame className="w-3 h-3" />}
                {lead?.temperature === 'WARM' && <SunMedium className="w-3 h-3" />}
                {lead?.temperature === 'COLD' && <Snowflake className="w-3 h-3" />}
                {lead?.temperature || 'WARM'}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#28232D] text-[#c9c0b5] font-semibold">
                Status: {lead?.pipeline_status || 'New'}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
              <span>{lead?.full_name || 'Prospect Lead'}</span>
            </h2>
            <p className="text-xs text-[#968a7e] mt-0.5">
              Captured via {lead?.lead_source || 'AI Chatbot & Voice Assistant'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#28232D] bg-[#141217] text-[#968a7e] hover:text-white hover:border-[#d8a868]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Triage Action Bar */}
        <div className="p-3 bg-[#1c1a22] border-b border-[#28232D] flex items-center justify-between gap-3 flex-wrap text-xs">
          {/* Temperature Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#968a7e] font-medium mr-1">Temp:</span>
            {(['HOT', 'WARM', 'COLD'] as const).map(t => (
              <button
                key={t}
                onClick={() => handleUpdateField('temperature', t)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  lead?.temperature === t
                    ? t === 'HOT'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : t === 'WARM'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-sky-500 text-white shadow-sm'
                    : 'bg-[#28232D] text-[#968a7e] hover:text-white'
                }`}
              >
                {t === 'HOT' && '🔥 HOT'}
                {t === 'WARM' && '☀️ WARM'}
                {t === 'COLD' && '❄️ COLD'}
              </button>
            ))}
          </div>

          {/* Pipeline Stage Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#968a7e] font-medium">Stage:</span>
            <select
              value={lead?.pipeline_status?.toLowerCase() || 'new'}
              onChange={e => handleUpdateField('pipeline_status', e.target.value)}
              className="bg-[#141217] border border-[#28232D] rounded-lg px-2.5 py-1 text-xs text-white capitalize focus:outline-none focus:border-[#d8a868]/50"
            >
              {PIPELINE_STATUSES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Agent Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#968a7e] font-medium">Assigned:</span>
            <select
              value={lead?.assigned_agent || ''}
              onChange={e => handleUpdateField('assigned_agent', e.target.value)}
              className="bg-[#141217] border border-[#28232D] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#d8a868]/50"
            >
              <option value="">Unassigned</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#28232D] px-5 bg-[#18161B] text-xs">
          {[
            { key: 'details', label: 'Lead Overview' },
            { key: 'conversation', label: `Conversations (${lead?.conversations?.length || 0})` },
            { key: 'tasks', label: `Follow-ups (${lead?.tasks?.length || 0})` },
            { key: 'notes', label: `Notes & Logs (${lead?.interactions?.length || 0})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-3 font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-[#d8a868] text-[#f0be7c]'
                  : 'border-transparent text-[#968a7e] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-[#28232D]">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#968a7e] animate-pulse">
              Loading lead details from MySQL...
            </div>
          ) : !lead ? (
            <div className="py-20 text-center text-xs text-rose-400">Lead record could not be loaded.</div>
          ) : activeTab === 'details' ? (
            <>
              {/* Contact Information Card */}
              <div className="rounded-xl border border-[#28232D] bg-[#18161B] p-4">
                <h3 className="text-xs font-bold text-[#d8a868] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#968a7e]">Full Name</span>
                    <div className="font-semibold text-white mt-0.5">{lead.full_name || 'Guest Prospect'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Phone Number</span>
                    <div className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-[#d8a868] hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </a>
                      ) : (
                        <span className="text-[#968a7e]">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Email Address</span>
                    <div className="font-semibold text-white mt-0.5 flex items-center gap-1.5">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-[#c9c0b5] hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" /> {lead.email}
                        </a>
                      ) : (
                        <span className="text-[#968a7e]">Not provided</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Preferred Location</span>
                    <div className="font-semibold text-white mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#d8a868]" />
                      <span>{lead.city || lead.locality || lead.original_location || 'Chennai, India'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requirement & Budget Card */}
              <div className="rounded-xl border border-[#28232D] bg-[#18161B] p-4">
                <h3 className="text-xs font-bold text-[#d8a868] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Property Requirements & Budget
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#968a7e]">Intent</span>
                    <div className="font-semibold text-white capitalize mt-0.5">{lead.intent || 'Buy'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Property Type</span>
                    <div className="font-semibold text-white capitalize mt-0.5">
                      {lead.property_type || 'Residential'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Target Budget</span>
                    <div className="font-mono font-bold text-[#f0be7c] mt-0.5">
                      {formatCurrency(lead.budget_min, lead.budget_max, lead.currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Bedrooms</span>
                    <div className="font-semibold text-white mt-0.5">{lead.bedrooms || 'Flexible'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Purchase Timeline</span>
                    <div className="font-semibold text-white mt-0.5">{lead.timeline || 'Immediate (< 3 mo)'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Next Follow-up</span>
                    <div className="font-semibold text-[#d8a868] mt-0.5">
                      {lead.next_followup ? new Date(lead.next_followup).toLocaleDateString() : 'None Scheduled'}
                    </div>
                  </div>
                </div>

                {lead.notes && (
                  <div className="mt-3 pt-3 border-t border-[#28232D]">
                    <span className="text-[11px] text-[#968a7e]">AI Stated Requirements / Notes</span>
                    <p className="text-xs text-[#c9c0b5] mt-1 leading-relaxed bg-[#141217] p-2.5 rounded-lg border border-[#28232D]">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => {
                    onClose();
                    setActiveModule('matching');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#d8a868]/40 bg-[#d8a868]/15 hover:bg-[#d8a868]/25 text-[#f0be7c] text-xs font-semibold"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Match Inventory</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    setActiveModule('deals');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Create Deal</span>
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#28232D] bg-[#1c1a22] hover:bg-[#25222e] text-white text-xs font-semibold"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#d8a868]" />
                  <span>Schedule Follow-up</span>
                </button>
              </div>
            </>
          ) : activeTab === 'conversation' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#d8a868]" /> Chatbot Conversation Transcript
                </h3>
                <span className="text-[10px] text-[#968a7e]">Direct database logs from AI session</span>
              </div>

              {lead.conversations?.length === 0 ? (
                <div className="py-12 text-center rounded-xl border border-dashed border-[#28232D] p-6">
                  <MessageSquare className="w-8 h-8 text-[#968a7e]/40 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">No raw transcript messages linked</p>
                  <p className="text-[11px] text-[#968a7e] mt-1">
                    This lead was created manually or conversation transcript was summarized into the notes tab.
                  </p>
                </div>
              ) : (
                lead.conversations.map((convo: any) => (
                  <div key={convo.id} className="rounded-xl border border-[#28232D] bg-[#18161B] overflow-hidden">
                    <div className="px-4 py-2 bg-[#1c1a22] border-b border-[#28232D] flex items-center justify-between text-xs text-[#968a7e]">
                      <span className="capitalize font-semibold text-white flex items-center gap-1.5">
                        <span>{convo.channel || 'Text'} Channel</span>
                        <span className="text-[10px] text-[#d8a868]">({convo.language || 'English'})</span>
                      </span>
                      <span>{new Date(convo.started_at).toLocaleString()}</span>
                    </div>

                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {convo.messages?.length === 0 ? (
                        <p className="text-xs text-[#968a7e] text-center py-4">No turn messages recorded.</p>
                      ) : (
                        convo.messages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-[#968a7e] mb-0.5">
                              {msg.role === 'user' ? 'Customer' : 'Lyka AI Assistant'}
                            </span>
                            <div
                              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-[#d8a868]/20 text-white border border-[#d8a868]/30 rounded-tr-none'
                                  : 'bg-[#262430] text-[#c9c0b5] border border-[#28232D] rounded-tl-none'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#d8a868]" /> Scheduled Follow-ups & Tasks
                </h3>
                <button
                  onClick={() => setShowScheduleForm(!showScheduleForm)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#d8a868] text-[#0B0A0C] text-xs font-bold hover:bg-[#f0be7c]"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showScheduleForm ? 'Cancel' : 'New Follow-up'}</span>
                </button>
              </div>

              {/* Schedule Follow-up Form */}
              {showScheduleForm && (
                <form
                  onSubmit={handleScheduleFollowup}
                  className="rounded-xl border border-[#d8a868]/40 bg-[#1e1c24] p-4 space-y-3 text-xs animate-in fade-in"
                >
                  <div className="font-semibold text-white">Schedule Next Follow-up</div>
                  <div>
                    <label className="text-[#968a7e] block mb-1">Follow-up Action / Title</label>
                    <input
                      type="text"
                      value={followupTitle}
                      onChange={e => setFollowupTitle(e.target.value)}
                      placeholder="e.g. Call regarding villa pricing"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#28232D] bg-[#141217] text-white focus:outline-none focus:border-[#d8a868]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#968a7e] block mb-1">Due Date</label>
                      <input
                        type="date"
                        value={followupDate}
                        onChange={e => setFollowupDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#28232D] bg-[#141217] text-white focus:outline-none focus:border-[#d8a868]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[#968a7e] block mb-1">Priority</label>
                      <select
                        value={followupPriority}
                        onChange={e => setFollowupPriority(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#28232D] bg-[#141217] text-white focus:outline-none focus:border-[#d8a868]"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSchedulingFollowup}
                    className="w-full py-2 rounded-lg bg-[#d8a868] text-[#0B0A0C] font-bold hover:bg-[#f0be7c] transition-colors"
                  >
                    {isSchedulingFollowup ? 'Scheduling...' : 'Confirm Follow-up'}
                  </button>
                </form>
              )}

              {/* Tasks List */}
              {lead.tasks?.length === 0 ? (
                <div className="py-10 text-center rounded-xl border border-dashed border-[#28232D] p-6">
                  <Calendar className="w-8 h-8 text-[#968a7e]/40 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">No follow-ups scheduled yet</p>
                  <p className="text-[11px] text-[#968a7e] mt-1">
                    Click "New Follow-up" above to set a task for this lead.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lead.tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl border border-[#28232D] bg-[#18161B] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{task.title}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              task.priority === 'high'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-[#28232D] text-[#c9c0b5]'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#968a7e] flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#d8a868]" /> Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                          {task.assignee_name && <span>Assigned to: {task.assignee_name}</span>}
                        </div>
                      </div>

                      {task.status === 'pending' ? (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Mark Complete</span>
                        </button>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#28232D] text-[#968a7e]">
                          Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#d8a868]" /> Notes & Interaction History
              </h3>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add an internal follow-up note, client preference, or meeting summary..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[#28232D] bg-[#18161B] text-xs text-white placeholder-[#968a7e]/60 focus:outline-none focus:border-[#d8a868]/60 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSavingNote || !newNote.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d8a868] text-[#0B0A0C] text-xs font-bold hover:bg-[#f0be7c] transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSavingNote ? 'Saving...' : 'Add Note'}</span>
                </button>
              </form>

              {/* Interaction Timeline List */}
              <div className="space-y-2.5 pt-2">
                {lead.interactions?.length === 0 ? (
                  <p className="text-xs text-[#968a7e] text-center py-6">No interaction records found.</p>
                ) : (
                  lead.interactions.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-[#28232D] bg-[#18161B] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[#968a7e] text-[10px]">
                        <span className="uppercase font-bold text-[#d8a868]">
                          {item.interaction_type?.replace(/_/g, ' ') || 'Activity'}
                        </span>
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-white leading-relaxed">{item.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetailDrawer;

/**
 * CustomerDetailModal.tsx — 7-Tab Unified Customer Profile View & Edit Customer Workflow
 * Tabs: Overview, Leads & Requirements, Conversations, Follow-ups, Interested Properties, Deals, Notes & Activity.
 * Full MySQL persistence • Edit Profile workflow with PATCH /api/crm/customers/:id
 * Dual dark and light theme support • High readability typography
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Banknote,
  MessageSquare,
  CheckCircle2,
  FileText,
  Clock,
  Flame,
  SunMedium,
  Snowflake,
  Edit3,
  Save,
  CheckSquare,
  CalendarClock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customerId: string | null;
  onClose: () => void;
  initialTab?: 'overview' | 'leads' | 'conversations' | 'followups' | 'properties' | 'deals' | 'notes';
  startInEditMode?: boolean;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  onClose,
  initialTab = 'overview',
  startInEditMode = false,
}) => {
  const { setSelectedLeadId, activeRole, theme, refreshDashboard } = useCrm();
  const isDark = theme === 'dark';

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'conversations' | 'followups' | 'properties' | 'deals' | 'notes'>(initialTab);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editContact, setEditContact] = useState('phone');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const fetchCustomer = () => {
    if (!customerId) return;
    setLoading(true);
    fetch(`/api/crm/customers/${customerId}`, {
      headers: { 'x-user-role': activeRole },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCustomer(d.data);
          setEditName(d.data.full_name || '');
          setEditPhone(d.data.phone || '');
          setEditEmail(d.data.email || '');
          setEditLocation(d.data.current_location || '');
          setEditContact(d.data.preferred_contact || 'phone');
        }
      })
      .catch(err => console.error('[CustomerDetail] Error fetching:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (customerId) {
      setIsEditing(startInEditMode);
      setEditError(null);
      setEditSuccess(false);
      setActiveTab(initialTab);
      fetchCustomer();
    } else {
      setCustomer(null);
    }
  }, [customerId, startInEditMode]);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setSavingEdit(true);
    setEditError(null);
    setEditSuccess(false);

    try {
      const res = await fetch(`/api/crm/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': activeRole,
        },
        body: JSON.stringify({
          full_name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || null,
          current_location: editLocation.trim(),
          preferred_contact: editContact,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditSuccess(true);
        setIsEditing(false);
        fetchCustomer();
        refreshDashboard();
      } else {
        setEditError(data.error || 'Failed to update customer');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error updating customer');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!customerId) return null;

  const tabs = [
    { key: 'overview', label: '1. Overview' },
    { key: 'leads', label: `2. Leads & Requirements (${customer?.leads?.length || 0})` },
    { key: 'conversations', label: `3. Conversations (${customer?.conversations?.length || 0})` },
    { key: 'followups', label: `4. Follow-ups (${customer?.tasks?.length || 0})` },
    { key: 'properties', label: `5. Visits & Interests (${customer?.visits?.length || 0})` },
    { key: 'deals', label: `6. Deals & History (${customer?.deals?.length || 0})` },
    { key: 'notes', label: '7. Notes & Audit' },
  ];

  const formatPrice = (val?: number) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-4xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-150 transition-colors ${
          isDark
            ? 'bg-[#141217] border-[#28232D] text-[#e6e1e5]'
            : 'bg-white border-[#E2D8D1] text-[#1c1b1e]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between gap-4 transition-colors ${
            isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d8a868]/20 border border-[#d8a868]/40 flex items-center justify-center text-sm font-bold text-[#d8a868]">
              {customer?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                  {customer?.full_name || 'Customer Profile'}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
                  Verified Client
                </span>
              </div>
              <p className={`text-xs flex items-center gap-3 mt-0.5 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
                {customer?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#d8a868]" /> {customer.phone}
                  </span>
                )}
                {customer?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#d8a868]" /> {customer.email}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isEditing
                  ? 'border-[#d8a868] bg-[#d8a868] text-[#0B0A0C]'
                  : isDark
                  ? 'border-[#28232D] bg-[#141217] text-[#d8a868] hover:bg-[#1f1d26]'
                  : 'border-[#E2D8D1] bg-white text-[#7d571f] hover:bg-[#FAF7F2]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-[#28232D] bg-[#141217] text-[#968a7e] hover:text-white'
                  : 'border-[#E2D8D1] bg-white text-[#817568] hover:text-[#1c1b1e]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit Success Notice */}
        {editSuccess && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Customer profile successfully updated in MySQL database.</span>
          </div>
        )}

        {/* Edit Error Notice */}
        {editError && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-5 py-2.5 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{editError}</span>
          </div>
        )}

        {/* ─── Inline Edit Form ────────────────────────────────────────── */}
        {isEditing && (
          <form onSubmit={handleSaveCustomer} className={`p-5 border-b space-y-4 ${
            isDark ? 'bg-[#18161B]/80 border-[#28232D]' : 'bg-[#FAF7F2] border-[#E2D8D1]'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#d8a868]">
                Edit Customer Details
              </h3>
              <span className="text-[11px] text-[#968a7e]">All changes update live in MySQL</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#968a7e] font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'border-[#28232D] bg-[#141217] text-white' : 'border-[#E2D8D1] bg-white text-[#1c1b1e]'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[#968a7e] font-semibold mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'border-[#28232D] bg-[#141217] text-white' : 'border-[#E2D8D1] bg-white text-[#1c1b1e]'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[#968a7e] font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'border-[#28232D] bg-[#141217] text-white' : 'border-[#E2D8D1] bg-white text-[#1c1b1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[#968a7e] font-semibold mb-1">Current Location</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'border-[#28232D] bg-[#141217] text-white' : 'border-[#E2D8D1] bg-white text-[#1c1b1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[#968a7e] font-semibold mb-1">Preferred Channel</label>
                <select
                  value={editContact}
                  onChange={e => setEditContact(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'border-[#28232D] bg-[#141217] text-white' : 'border-[#E2D8D1] bg-white text-[#1c1b1e]'
                  }`}
                >
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-[#28232D] text-xs font-semibold text-[#968a7e] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-xs font-bold transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingEdit ? 'Saving...' : 'Save Customer Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ─── 7 Tabs Navigation ───────────────────────────────────────── */}
        <div
          className={`flex overflow-x-auto border-b px-4 text-xs scrollbar-none transition-colors ${
            isDark ? 'border-[#28232D] bg-[#18161B]/60' : 'border-[#E2D8D1] bg-[#FAF7F2]'
          }`}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-3 font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-[#d8a868] text-[#d8a868]'
                  : isDark
                  ? 'border-transparent text-[#968a7e] hover:text-white'
                  : 'border-transparent text-[#817568] hover:text-[#1c1b1e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tabs Body ───────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#968a7e] animate-pulse">
              Loading profile dossier from MySQL...
            </div>
          ) : !customer ? (
            <div className="py-20 text-center text-xs text-[#968a7e]">
              Customer profile not found.
            </div>
          ) : activeTab === 'overview' ? (
            /* TAB 1: OVERVIEW */
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#968a7e]">Total Inquiries</div>
                  <div className="text-xl font-bold font-mono mt-1 text-[#d8a868]">
                    {customer.leads?.length || 0}
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#968a7e]">Follow-ups Due</div>
                  <div className="text-xl font-bold font-mono mt-1 text-sky-400">
                    {customer.tasks?.filter((t: any) => t.status === 'pending').length || 0}
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#968a7e]">Site Visits</div>
                  <div className="text-xl font-bold font-mono mt-1 text-emerald-400">
                    {customer.visits?.length || 0}
                  </div>
                </div>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#968a7e]">Active Deals</div>
                  <div className="text-xl font-bold font-mono mt-1 text-violet-400">
                    {customer.deals?.length || 0}
                  </div>
                </div>
              </div>

              {/* Profile Details Dossier */}
              <div className={`rounded-xl border p-5 ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                  Verified Client Contact Dossier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#968a7e]">Full Name:</span>
                    <div className="font-semibold text-white mt-0.5">{customer.full_name}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Direct Phone:</span>
                    <div className="font-semibold font-mono text-[#d8a868] mt-0.5">{customer.phone || '—'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Email Address:</span>
                    <div className="font-semibold text-[#c9c0b5] mt-0.5">{customer.email || '—'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Current Location:</span>
                    <div className="font-semibold text-[#c9c0b5] mt-0.5">{customer.current_location || 'Chennai, India'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Preferred Channel:</span>
                    <div className="font-semibold capitalize text-emerald-400 mt-0.5">{customer.preferred_contact || 'Phone'}</div>
                  </div>
                  <div>
                    <span className="text-[#968a7e]">Registered Date:</span>
                    <div className="font-mono text-[#968a7e] mt-0.5">
                      {new Date(customer.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'leads' ? (
            /* TAB 2: LEADS & REQUIREMENTS */
            <div className="space-y-3">
              {(customer.leads || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-[#968a7e]">
                  No linked property inquiries recorded for this customer yet.
                </div>
              ) : (
                customer.leads.map((l: any) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      onClose();
                      setSelectedLeadId(l.id);
                    }}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isDark
                        ? 'border-[#28232D] bg-[#18161B] hover:border-[#d8a868]/50'
                        : 'border-[#E2D8D1] bg-[#FAF7F2] hover:border-[#d8a868]/60'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold text-sm capitalize ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
                        {l.property_type || 'Residential'} • {l.intent || 'Buy'}
                      </div>
                      <div className="text-xs text-[#968a7e] flex items-center gap-3 mt-1">
                        <span>Locality: {l.locality || l.city || 'Chennai'}</span>
                        <span>Budget: {l.budget_max ? formatPrice(l.budget_max) : 'Flexible'}</span>
                        <span className={`font-bold ${
                          l.temperature === 'HOT' ? 'text-rose-400' : l.temperature === 'WARM' ? 'text-amber-400' : 'text-sky-400'
                        }`}>
                          {l.temperature}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[#d8a868] font-bold flex items-center gap-1">
                      <span>Inspect Lead</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'conversations' ? (
            /* TAB 3: CONVERSATIONS & DIALOGUE TURNS */
            <div className="space-y-4">
              {(customer.conversations || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-[#968a7e]">
                  No live voice or chat sessions linked to this client yet.
                </div>
              ) : (
                customer.conversations.map((c: any) => (
                  <div key={c.id} className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#28232D]">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#d8a868]" />
                        <span className="font-bold text-xs uppercase text-white">{c.channel || 'Text Chat'} Session</span>
                        <span className="text-[10px] font-mono text-[#d8a868] bg-[#d8a868]/15 px-2 py-0.5 rounded">
                          {c.language || 'English'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#968a7e]">
                        {new Date(c.started_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Messages turns */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {(c.messages || []).map((m: any) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-lg text-xs ${
                            m.role === 'assistant'
                              ? 'bg-[#d8a868]/10 text-[#f0be7c] border border-[#d8a868]/20 mr-6'
                              : 'bg-[#28232D] text-white ml-6'
                          }`}
                        >
                          <div className="font-bold text-[10px] text-[#968a7e] uppercase mb-0.5">{m.role}</div>
                          <div>{m.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'followups' ? (
            /* TAB 4: TASKS & FOLLOW-UPS */
            <div className="space-y-3">
              {(customer.tasks || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-[#968a7e]">
                  No scheduled follow-up tasks for this customer.
                </div>
              ) : (
                customer.tasks.map((t: any) => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold text-sm ${t.status === 'completed' ? 'line-through opacity-60 text-white' : 'text-white'}`}>
                        {t.title}
                      </div>
                      <div className="text-xs text-[#968a7e] mt-1 flex items-center gap-3">
                        <span>Due: {new Date(t.due_date).toLocaleDateString()}</span>
                        <span>Assignee: {t.assignee_name || 'Assigned Agent'}</span>
                        <span className="capitalize font-bold text-[#d8a868]">{t.priority} priority</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      t.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'properties' ? (
            /* TAB 5: SITE VISITS & INTERESTED PROPERTIES */
            <div className="space-y-3">
              {(customer.visits || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-[#968a7e]">
                  No site visits recorded yet for this client.
                </div>
              ) : (
                customer.visits.map((sv: any) => (
                  <div
                    key={sv.id}
                    className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-white">{sv.property_title || 'Property Viewing'}</div>
                      <span className="font-mono text-xs text-[#d8a868]">{new Date(sv.visit_date).toLocaleDateString()} {sv.visit_time}</span>
                    </div>
                    <div className="text-xs text-[#968a7e] mt-1">
                      Status: <span className="font-bold text-white capitalize">{sv.status}</span> • Agent: {sv.employee_name || 'Agent'}
                    </div>
                    {sv.feedback && (
                      <p className="text-xs text-[#c9c0b5] mt-2 italic">"{sv.feedback}"</p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'deals' ? (
            /* TAB 6: DEALS & TRANSACTION HISTORY */
            <div className="space-y-3">
              {(customer.deals || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-[#968a7e]">
                  No commercial deals or purchase history recorded yet.
                </div>
              ) : (
                customer.deals.map((d: any) => (
                  <div
                    key={d.id}
                    className={`p-4 rounded-xl border ${isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm text-white">{d.title}</div>
                      <span className="font-mono font-bold text-sm text-[#d8a868]">{formatPrice(d.deal_value)}</span>
                    </div>
                    <div className="text-xs text-[#968a7e] mt-1 flex items-center gap-3">
                      <span>Status: <span className="font-bold text-emerald-400 capitalize">{String(d.deal_status).replace(/_/g, ' ')}</span></span>
                      <span>Agent: {d.agent_name || 'Assigned Consultant'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* TAB 7: NOTES & ACTIVITY */
            <div className={`p-4 rounded-xl border text-xs space-y-3 ${
              isDark ? 'border-[#28232D] bg-[#18161B]' : 'border-[#E2D8D1] bg-[#FAF7F2]'
            }`}>
              <div className="font-bold text-sm text-white">Client Notes & System Log</div>
              <p className="text-[#968a7e]">
                This customer record was created and is maintained via MySQL `customers` table. All customer updates generate an audit entry in the `audit_logs` security ledger.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#968a7e]">
                Customer UUID: {customer.id}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;

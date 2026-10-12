/**
 * AddLeadModal.tsx — Simple, accessible dialog to quickly add a new lead
 */
import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { X, UserPlus, Flame, SunMedium, Snowflake } from 'lucide-react';

export const AddLeadModal: React.FC = () => {
  const { isAddLeadOpen, setIsAddLeadOpen, refreshDashboard, employees } = useCrm();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [intent, setIntent] = useState('buy');
  const [propertyType, setPropertyType] = useState('apartment');
  const [city, setCity] = useState('Chennai');
  const [budgetMax, setBudgetMax] = useState('');
  const [temperature, setTemperature] = useState('WARM');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAddLeadOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim() || 'Prospect',
          phone: phone.trim() || null,
          email: email.trim() || null,
          intent,
          property_type: propertyType,
          city: city.trim() || 'Chennai',
          budget_max: budgetMax ? Number(budgetMax) : null,
          temperature,
          pipeline_status: 'new',
          assigned_agent: assignedAgent || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddLeadOpen(false);
        refreshDashboard();
      } else {
        setError(data.error || 'Failed to create lead');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        onClick={() => setIsAddLeadOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#141217] border border-[#28232D] shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#28232D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d8a868]/15 border border-[#d8a868]/30 text-[#d8a868]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Lead</h3>
              <p className="text-xs text-[#968a7e]">Register a prospect into the CRM pipeline</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddLeadOpen(false)}
            className="p-1.5 rounded-lg border border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Customer Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Vikram Sundaram"
                required
                className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              />
            </div>
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98400 12345"
                className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              />
            </div>
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Preferred Location</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. ECR / OMR / Chennai"
                className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              />
            </div>
          </div>

          {/* Property & Budget */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Intent</label>
              <select
                value={intent}
                onChange={e => setIntent(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="rent">Rent</option>
                <option value="lease">Lease</option>
              </select>
            </div>
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              >
                <option value="apartment">Apartment</option>
                <option value="villa">Luxury Villa</option>
                <option value="residential_land">Land Plot</option>
                <option value="commercial">Commercial</option>
                <option value="penthouse">Penthouse</option>
              </select>
            </div>
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Max Budget (INR)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={e => setBudgetMax(e.target.value)}
                placeholder="e.g. 15000000"
                className="w-full px-2.5 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
              />
            </div>
          </div>

          {/* Temperature & Assignment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Lead Temperature</label>
              <div className="flex gap-1.5">
                {(['HOT', 'WARM', 'COLD'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemperature(t)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      temperature === t
                        ? t === 'HOT'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : t === 'WARM'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'border-[#28232D] bg-[#18161B] text-[#968a7e]'
                    }`}
                  >
                    {t === 'HOT' && '🔥 HOT'}
                    {t === 'WARM' && '☀️ WARM'}
                    {t === 'COLD' && '❄️ COLD'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[#c9c0b5] font-medium mb-1">Assigned Employee</label>
              <select
                value={assignedAgent}
                onChange={e => setAssignedAgent(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
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

          {/* Notes */}
          <div>
            <label className="block text-[#c9c0b5] font-medium mb-1">Requirements / Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Specific customer requirements, timeline, or notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddLeadOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#28232D] text-[#968a7e] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#d8a868] text-[#0B0A0C] font-bold hover:bg-[#f0be7c] transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Lead...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;

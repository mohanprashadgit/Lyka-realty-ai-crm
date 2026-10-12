/**
 * AddCustomerModal.tsx — Simple dialog to add a verified customer to the CRM
 */
import React, { useState } from 'react';
import { useCrm } from '../context/CrmContext';
import { X, UserCheck } from 'lucide-react';

export const AddCustomerModal: React.FC = () => {
  const { isAddCustomerOpen, setIsAddCustomerOpen, activeRole, refreshDashboard } = useCrm();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Chennai, India');
  const [preferredContact, setPreferredContact] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAddCustomerOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': activeRole,
        },
        body: JSON.stringify({
          full_name: fullName.trim() || 'Client',
          phone: phone.trim() || null,
          email: email.trim() || null,
          current_location: currentLocation.trim() || 'Chennai, India',
          preferred_contact: preferredContact,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddCustomerOpen(false);
        refreshDashboard();
      } else {
        setError(data.error || 'Failed to create customer');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        onClick={() => setIsAddCustomerOpen(false)}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-[#141217] border border-[#28232D] shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#28232D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d8a868]/15 border border-[#d8a868]/30 text-[#d8a868]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Customer</h3>
              <p className="text-xs text-[#968a7e]">Create a verified customer profile</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddCustomerOpen(false)}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-[#c9c0b5] font-medium mb-1">Customer Full Name *</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Krishnan"
              required
              className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
            />
          </div>

          <div>
            <label className="block text-[#c9c0b5] font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98401 54321"
              required
              className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
            />
          </div>

          <div>
            <label className="block text-[#c9c0b5] font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ramesh.k@example.com"
              className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
            />
          </div>

          <div>
            <label className="block text-[#c9c0b5] font-medium mb-1">Current Location</label>
            <input
              type="text"
              value={currentLocation}
              onChange={e => setCurrentLocation(e.target.value)}
              placeholder="e.g. Chennai / Bangalore / Dubai"
              className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
            />
          </div>

          <div>
            <label className="block text-[#c9c0b5] font-medium mb-1">Preferred Contact Channel</label>
            <select
              value={preferredContact}
              onChange={e => setPreferredContact(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#28232D] bg-[#18161B] text-white focus:outline-none focus:border-[#d8a868]"
            >
              <option value="phone">Phone Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#28232D] text-[#968a7e] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#d8a868] text-[#0B0A0C] font-bold hover:bg-[#f0be7c] transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;

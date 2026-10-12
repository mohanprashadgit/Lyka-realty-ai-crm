/**
 * NotificationsView.tsx — In-App Operational Notifications & Lead Alerts
 * Real MySQL crm_notifications • Read status • Priority alerts
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  Bell,
  RefreshCw,
  Flame,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { activeRole, theme } = useCrm();
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    fetch('/api/crm/notifications', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => res.json())
      .then(d => {
        if (d.success) setNotifications(d.data || []);
      })
      .catch(err => console.error('[NotifsView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, [activeRole]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
            <span>Operational Notifications</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {notifications.length} Alerts
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            HOT lead notifications, upcoming customer visits, and assigned tasks
          </p>
        </div>

        <button
          onClick={fetchNotifs}
          disabled={loading}
          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
              : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
          }`}
          title="Refresh Notifications"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
        </button>
      </div>

      {/* ─── Notifications List ──────────────────────────────────────── */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading notifications from database...
          </div>
        ) : notifications.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'}`}>
            <Bell className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No unread notifications</h4>
            <p className="text-xs text-[#968a7e] mt-1">You are all caught up with your operational alerts.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
              }`}
            >
              <div className="p-2 rounded-xl bg-[#d8a868]/15 text-[#d8a868] shrink-0 mt-0.5">
                {n.type === 'hot_lead' ? <Flame className="w-4 h-4 text-rose-400" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>{n.title}</h4>
                  <span className="text-[11px] font-mono text-[#968a7e] shrink-0">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[#968a7e] mt-1">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsView;

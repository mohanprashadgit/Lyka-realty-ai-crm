/**
 * TasksManagementView.tsx — Follow-ups & Agent Tasks Management
 * Real MySQL tasks • Real 1-click completion • Real task creation
 * Aura Privé styling • Responsive layout
 */
import React, { useEffect, useState } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  CheckSquare,
  Search,
  RefreshCw,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';

export const TasksManagementView: React.FC = () => {
  const { activeRole, employees, theme } = useCrm();
  const isDark = theme === 'dark';

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    setForbiddenError(null);
    fetch('/api/crm/tasks', {
      headers: { 'x-user-role': activeRole },
    })
      .then(res => {
        if (res.status === 403) {
          return res.json().then(d => {
            setForbiddenError(d.error || 'Access Denied');
            setTasks([]);
          });
        }
        return res.json().then(d => {
          if (d.success) setTasks(d.data || []);
        });
      })
      .catch(err => console.error('[TasksView] Fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [activeRole]);

  const handleMarkComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/crm/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-role': activeRole },
        body: JSON.stringify({ completion_notes: 'Marked completed on Tasks Board' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (err) {
      console.error('[TasksView] Complete task error:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) {
      setFormError('Title and due date are required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': activeRole },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          due_date: newDueDate,
          priority: newPriority,
          assigned_to: newAssignee || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchTasks();
      } else {
        setFormError(data.error || 'Failed to create task');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating task');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = tasks.filter(t => {
    const matchesSearch =
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.lead_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority?.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (forbiddenError) {
    return (
      <div className="py-20 text-center rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 max-w-xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Access Denied</h3>
        <p className="text-xs text-[#968a7e] mt-2">{forbiddenError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>
            <span>Follow-ups & Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#d8a868]/15 text-[#d8a868] font-mono font-bold border border-[#d8a868]/30">
              {tasks.filter(t => t.status === 'pending').length} Pending
            </span>
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#968a7e]' : 'text-[#817568]'}`}>
            Daily prospect follow-ups, agent action reminders, and appointment scheduling
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#28232D] bg-[#18161B] text-[#968a7e] hover:text-white'
                : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#817568] hover:text-[#1c1b1e]'
            }`}
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d8a868]' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-sm font-bold shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#968a7e] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks by title, prospect, or assigned agent..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#d8a868]/60 ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white placeholder-[#968a7e]/60' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          >
            <option value="pending">Pending Tasks</option>
            <option value="completed">Completed Tasks</option>
            <option value="ALL">All Tasks</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
              isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* ─── Tasks List ──────────────────────────────────────────────── */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isDark ? 'border-[#28232D] bg-[#141217]' : 'border-[#E2D8D1] bg-white'
      }`}>
        {loading ? (
          <div className="py-20 text-center text-sm text-[#968a7e] animate-pulse">
            Loading tasks from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center p-6">
            <CheckSquare className="w-10 h-10 text-[#968a7e]/40 mx-auto mb-3" />
            <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#1c1b1e]'}`}>No tasks found</h4>
            <p className="text-xs text-[#968a7e] mt-1">All action items completed or filter returned no matches.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'border-[#28232D] text-[#968a7e] bg-[#18161B]/60' : 'border-[#E2D8D1] text-[#817568] bg-[#FAF7F2]'
                }`}>
                  <th className="py-3.5 px-4 min-w-[260px]">Task Details</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Due Date</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Priority</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Assigned Agent</th>
                  <th className="py-3.5 px-4 min-w-[100px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-[#28232D]/70' : 'divide-[#E2D8D1]'}`}>
                {filtered.map(task => (
                  <tr key={task.id} className={`transition-colors ${isDark ? 'hover:bg-[#1f1d26]/60' : 'hover:bg-[#FAF7F2]'}`}>
                    <td className="py-4 px-4">
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1c1b1e]'} ${
                        task.status === 'completed' ? 'line-through opacity-60' : ''
                      }`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-[#968a7e] mt-0.5 max-w-md truncate">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <span className={`inline-flex items-center gap-1.5 ${
                        new Date(task.due_date) < new Date() && task.status === 'pending'
                          ? 'text-rose-400 font-bold'
                          : 'text-[#c9c0b5]'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'high'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                      }`}>
                        {task.priority || 'medium'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[#c9c0b5]">
                      {task.assignee_name || 'Unassigned'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {task.status === 'pending' ? (
                        <button
                          onClick={() => handleMarkComplete(task.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Mark Done
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create Task Modal ───────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-colors ${
            isDark ? 'bg-[#141217] border-[#28232D] text-[#e6e1e5]' : 'bg-white border-[#E2D8D1] text-[#1c1b1e]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#28232D]">
              <h3 className="font-bold text-base text-white">Create New Task</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#968a7e] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Call client for OMR site visit..."
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Additional follow-up context..."
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                    }`}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#968a7e] uppercase mb-1">Assign Agent</label>
                <select
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    isDark ? 'border-[#28232D] bg-[#18161B] text-white' : 'border-[#E2D8D1] bg-[#FAF7F2] text-[#1c1b1e]'
                  }`}
                >
                  <option value="">Unassigned</option>
                  {(employees || []).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#28232D] text-xs font-semibold text-[#968a7e] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#d8a868] hover:bg-[#f0be7c] text-[#0B0A0C] text-xs font-bold transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksManagementView;

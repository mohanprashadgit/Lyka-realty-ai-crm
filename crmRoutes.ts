/**
 * crmRoutes.ts — Dedicated modular CRM REST API Router
 * 
 * Provides database-backed CRM endpoints for dashboard metrics, leads, customers,
 * properties, land inventory, deals, appointments, tasks, employees, rewards, and audit logs.
 * Completely decoupled from existing chatbot routes.
 */
import { Router } from 'express';
import { getPool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export const crmRouter = Router();

/**
 * Role-based authorization middleware
 * Extracts active role from 'x-user-role' header or 'role' query param.
 * Blocks unauthorized access with HTTP 403 Forbidden.
 */
function requireRoles(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    const role = (req.headers['x-user-role'] as string) || (req.query.role as string) || 'Unauthenticated';
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${role}' is not authorized to access this resource. Required role: ${allowedRoles.join(' or ')}.`,
      });
    }
    next();
  };
}

// ─── 1. Dashboard Overview Metrics ──────────────────────────────────
crmRouter.get('/dashboard', async (_req, res) => {
  const db = getPool();
  try {
    // 1. Core KPIs
    const [leadsCount] = await db.query('SELECT COUNT(*) as total FROM leads') as any;
    const [newLeadsCount] = await db.query("SELECT COUNT(*) as total FROM leads WHERE LOWER(pipeline_status) = 'new'") as any;
    const [hotCount] = await db.query("SELECT COUNT(*) as total FROM leads WHERE temperature = 'HOT'") as any;
    const [warmCount] = await db.query("SELECT COUNT(*) as total FROM leads WHERE temperature = 'WARM'") as any;
    const [coldCount] = await db.query("SELECT COUNT(*) as total FROM leads WHERE temperature = 'COLD'") as any;
    const [customersCount] = await db.query('SELECT COUNT(*) as total FROM customers') as any;
    const [propertiesCount] = await db.query("SELECT COUNT(*) as total FROM properties WHERE status = 'available'") as any;
    const [landCount] = await db.query("SELECT COUNT(*) as total FROM land_listings WHERE status = 'available'") as any;
    const [visitsCount] = await db.query("SELECT COUNT(*) as total FROM site_visits WHERE status = 'scheduled'") as any;
    const [tasksCount] = await db.query("SELECT COUNT(*) as total FROM tasks WHERE status = 'pending'") as any;
    const [activeDealsCount] = await db.query("SELECT COUNT(*) as total FROM deals WHERE deal_status NOT IN ('closed_won', 'closed_lost')") as any;
    const [closedDealsCount] = await db.query("SELECT COUNT(*) as total FROM deals WHERE deal_status = 'closed_won'") as any;

    // Actual revenue from closed deals only
    const [revenueRes] = await db.query("SELECT COALESCE(SUM(deal_value), 0) as total FROM deals WHERE deal_status = 'closed_won'") as any;
    const [pipelineRes] = await db.query("SELECT COALESCE(SUM(projected_value), 0) as total FROM deals WHERE deal_status NOT IN ('closed_won', 'closed_lost')") as any;

    // 2. Recent Leads (with assigned agent and next follow-up date)
    const [recentLeads] = await db.query(`
      SELECT l.id, l.full_name, l.phone, l.email, l.intent, l.property_type, l.city,
             l.budget_min, l.budget_max, l.currency, l.temperature, l.pipeline_status,
             l.created_at, l.notes, l.assigned_agent,
             e.full_name as assigned_employee_name,
             (SELECT MIN(due_date) FROM tasks WHERE lead_id = l.id AND status = 'pending') as next_followup
      FROM leads l
      LEFT JOIN employees e ON l.assigned_agent = e.id
      ORDER BY l.created_at DESC
      LIMIT 8
    `) as any;

    // 3. Leads by Temperature Breakdown
    const [tempDist] = await db.query(`
      SELECT COALESCE(temperature, 'UNASSIGNED') as temp, COUNT(*) as count
      FROM leads
      GROUP BY temperature
    `) as any;

    // 4. Leads by Intent Breakdown
    const [intentDist] = await db.query(`
      SELECT COALESCE(intent, 'general') as intent, COUNT(*) as count
      FROM leads
      GROUP BY intent
    `) as any;

    // 5. Follow-ups Today / Pending Tasks
    const [followupsToday] = await db.query(`
      SELECT t.id, t.title, t.description, t.due_date, t.priority, t.status,
             e.full_name as assigned_employee,
             COALESCE(l.full_name, c.full_name, 'Prospect') as prospect_name,
             l.id as lead_id, c.id as customer_id
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN leads l ON t.lead_id = l.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.status = 'pending'
      ORDER BY t.due_date ASC
      LIMIT 6
    `) as any;

    // 6. Lead Pipeline Stages Distribution
    const [pipelineStageCounts] = await db.query(`
      SELECT LOWER(COALESCE(pipeline_status, 'new')) as stage, COUNT(*) as count
      FROM leads
      GROUP BY stage
    `) as any;

    // Map stages cleanly
    const stageMap: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      matching: 0,
      site_visit: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    };
    for (const row of pipelineStageCounts || []) {
      const s = String(row.stage).toLowerCase().replace(/[\s-]/g, '_');
      if (s.includes('won')) stageMap.won = (stageMap.won || 0) + Number(row.count);
      else if (s.includes('lost')) stageMap.lost = (stageMap.lost || 0) + Number(row.count);
      else if (s.includes('contact')) stageMap.contacted = (stageMap.contacted || 0) + Number(row.count);
      else if (s.includes('qualif')) stageMap.qualified = (stageMap.qualified || 0) + Number(row.count);
      else if (s.includes('match')) stageMap.matching = (stageMap.matching || 0) + Number(row.count);
      else if (s.includes('visit')) stageMap.site_visit = (stageMap.site_visit || 0) + Number(row.count);
      else if (s.includes('negot')) stageMap.negotiation = (stageMap.negotiation || 0) + Number(row.count);
      else stageMap.new = (stageMap.new || 0) + Number(row.count);
    }

    // 7. Recent Activity (from audit logs and interactions)
    const [recentActivities] = await db.query(`
      SELECT id, actor_name, action, record_type, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 6
    `) as any;

    // 8. Upcoming Site Visits
    const [upcomingVisits] = await db.query(`
      SELECT sv.id, sv.visit_date, sv.visit_time, sv.status,
             COALESCE(l.full_name, c.full_name, 'Prospect') as prospect_name,
             p.title as property_title
      FROM site_visits sv
      LEFT JOIN leads l ON sv.lead_id = l.id
      LEFT JOIN customers c ON sv.customer_id = c.id
      LEFT JOIN properties p ON sv.property_id = p.id
      ORDER BY sv.visit_date ASC
      LIMIT 5
    `) as any;

    // 9. Employees Leaderboard
    const [employees] = await db.query(`
      SELECT id, full_name, role, department, points_balance, monthly_target
      FROM employees
      ORDER BY points_balance DESC
      LIMIT 6
    `) as any;

    res.json({
      success: true,
      kpis: {
        totalLeads: Number(leadsCount?.[0]?.total || 0),
        newLeads: Number(newLeadsCount?.[0]?.total || 0),
        hotLeads: Number(hotCount?.[0]?.total || 0),
        warmLeads: Number(warmCount?.[0]?.total || 0),
        coldLeads: Number(coldCount?.[0]?.total || 0),
        totalCustomers: Number(customersCount?.[0]?.total || 0),
        availableProperties: Number(propertiesCount?.[0]?.total || 0),
        availableLand: Number(landCount?.[0]?.total || 0),
        upcomingVisits: Number(visitsCount?.[0]?.total || 0),
        pendingTasks: Number(tasksCount?.[0]?.total || 0),
        activeDeals: Number(activeDealsCount?.[0]?.total || 0),
        closedDeals: Number(closedDealsCount?.[0]?.total || 0),
        actualRevenue: Number(revenueRes?.[0]?.total || 0),
        projectedPipeline: Number(pipelineRes?.[0]?.total || 0),
      },
      recentLeads: recentLeads || [],
      followupsToday: followupsToday || [],
      pipelineStages: stageMap,
      recentActivities: recentActivities || [],
      temperatureDistribution: tempDist || [],
      intentDistribution: intentDist || [],
      upcomingVisits: upcomingVisits || [],
      employeeLeaderboard: employees || [],
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[CRM API] Dashboard fetch error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to load dashboard data' });
  }
});

// ─── 2. Leads Management ────────────────────────────────────────────
crmRouter.get('/leads', async (req, res) => {
  const db = getPool();
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const tempFilter = req.query.temperature as string;
    const statusFilter = req.query.status as string;
    const intentFilter = req.query.intent as string;
    const filterType = req.query.filter as string;
    const search = req.query.search as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (tempFilter && tempFilter !== 'ALL') {
      conditions.push('l.temperature = ?');
      params.push(tempFilter.toUpperCase());
    }

    if (statusFilter && statusFilter !== 'ALL') {
      conditions.push('LOWER(l.pipeline_status) = ?');
      params.push(statusFilter.toLowerCase());
    }

    if (intentFilter && intentFilter !== 'ALL') {
      conditions.push('LOWER(l.intent) = ?');
      params.push(intentFilter.toLowerCase());
    }

    // Specific filters: unassigned, followup_due, won, lost
    if (filterType === 'unassigned') {
      conditions.push('(l.assigned_agent IS NULL OR l.assigned_agent = "")');
    } else if (filterType === 'followup_due') {
      conditions.push('EXISTS (SELECT 1 FROM tasks WHERE lead_id = l.id AND status = "pending" AND due_date <= CURDATE())');
    } else if (filterType === 'won') {
      conditions.push('LOWER(l.pipeline_status) LIKE "%won%"');
    } else if (filterType === 'lost') {
      conditions.push('LOWER(l.pipeline_status) LIKE "%lost%"');
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push('(l.full_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ? OR l.city LIKE ? OR l.id LIKE ? OR l.notes LIKE ?)');
      params.push(q, q, q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes] = await db.query(`SELECT COUNT(*) as total FROM leads l ${whereClause}`, params) as any;
    const total = Number(countRes?.[0]?.total || 0);

    const [leads] = await db.query(`
      SELECT l.*,
             e.full_name as assigned_employee_name,
             (SELECT MIN(due_date) FROM tasks WHERE lead_id = l.id AND status = 'pending') as next_followup,
             (SELECT MAX(created_at) FROM lead_interactions WHERE lead_id = l.id) as last_interaction_date
      FROM leads l
      LEFT JOIN employees e ON l.assigned_agent = e.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]) as any;

    res.json({
      success: true,
      data: leads || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    console.error('[CRM API] Leads fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new lead
crmRouter.post('/leads', async (req, res) => {
  const db = getPool();
  try {
    const {
      full_name,
      phone,
      email,
      intent,
      property_type,
      city,
      locality,
      budget_min,
      budget_max,
      currency,
      temperature,
      pipeline_status,
      assigned_agent,
      notes,
    } = req.body;

    const id = uuidv4();
    await db.query(`
      INSERT INTO leads (
        id, full_name, phone, email, intent, property_type,
        city, locality, budget_min, budget_max, currency,
        temperature, pipeline_status, assigned_agent, notes, lead_source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      full_name || 'Prospect',
      phone || null,
      email || null,
      intent || 'buy',
      property_type || 'residential',
      city || 'Chennai',
      locality || null,
      budget_min ? Number(budget_min) : null,
      budget_max ? Number(budget_max) : null,
      currency || 'INR',
      temperature || 'WARM',
      pipeline_status || 'new',
      assigned_agent || null,
      notes || null,
      'CRM Manual Entry',
    ]);

    // Record audit log
    await db.query(`
      INSERT INTO audit_logs (id, actor_name, actor_role, action, record_type, record_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), 'Employee', 'CRM Staff', 'create', 'lead', id, `Lead created for ${full_name || 'Prospect'}`]);

    // Record interaction
    await db.query(`
      INSERT INTO lead_interactions (id, lead_id, interaction_type, summary)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), id, 'creation', `Lead record created via CRM interface.`]);

    res.json({ success: true, id, message: 'Lead created successfully' });
  } catch (err: any) {
    console.error('[CRM API] Create lead error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single lead with conversations, notes, customer & tasks
crmRouter.get('/leads/:id', async (req, res) => {
  const db = getPool();
  try {
    const leadId = req.params.id;
    const [leadRows] = await db.query(`
      SELECT l.*,
             e.full_name as assigned_employee_name,
             c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email,
             (SELECT MIN(due_date) FROM tasks WHERE lead_id = l.id AND status = 'pending') as next_followup
      FROM leads l
      LEFT JOIN employees e ON l.assigned_agent = e.id
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE l.id = ?
    `, [leadId]) as any;

    if (!leadRows || leadRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = leadRows[0];

    // Fetch linked conversations & messages
    const [convos] = await db.query(`
      SELECT c.id, c.channel, c.language, c.started_at, c.ended_at
      FROM conversations c
      WHERE c.lead_id = ? OR (c.session_id = ? AND ? != '')
      ORDER BY c.started_at DESC
    `, [leadId, lead.guest_session_id || '', lead.guest_session_id || '']) as any;

    const conversationsWithMessages = [];
    for (const c of convos || []) {
      const [msgs] = await db.query(`
        SELECT id, role, content, message_type, created_at
        FROM conversation_messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
      `, [c.id]) as any;
      conversationsWithMessages.push({ ...c, messages: msgs || [] });
    }

    // Fetch interactions / notes
    const [interactions] = await db.query(`
      SELECT * FROM lead_interactions WHERE lead_id = ? ORDER BY created_at DESC
    `, [leadId]) as any;

    // Fetch tasks / follow-ups
    const [tasks] = await db.query(`
      SELECT t.*, e.full_name as assignee_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE t.lead_id = ?
      ORDER BY t.due_date ASC
    `, [leadId]) as any;

    res.json({
      success: true,
      data: {
        ...lead,
        conversations: conversationsWithMessages,
        interactions: interactions || [],
        tasks: tasks || [],
      },
    });
  } catch (err: any) {
    console.error('[CRM API] Get lead by id error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update lead (status, temp, assigned agent, notes, etc.)
crmRouter.patch('/leads/:id', async (req, res) => {
  const db = getPool();
  try {
    const leadId = req.params.id;
    const allowedFields = [
      'full_name', 'phone', 'email', 'intent', 'property_type',
      'city', 'locality', 'budget_min', 'budget_max', 'currency',
      'temperature', 'pipeline_status', 'assigned_agent', 'notes'
    ];

    const updates: string[] = [];
    const params: any[] = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided to update' });
    }

    params.push(leadId);
    await db.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);

    // Record interaction
    const summary = req.body.pipeline_status
      ? `Pipeline status updated to ${req.body.pipeline_status}`
      : req.body.temperature
      ? `Temperature updated to ${req.body.temperature}`
      : req.body.assigned_agent
      ? `Lead assigned to agent`
      : `Lead details updated`;

    await db.query(`
      INSERT INTO lead_interactions (id, lead_id, interaction_type, summary)
      VALUES (?, ?, ?, ?)
    `, [uuidv4(), leadId, 'update', summary]);

    res.json({ success: true, message: 'Lead updated successfully' });
  } catch (err: any) {
    console.error('[CRM API] Update lead error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add note to lead
crmRouter.post('/leads/:id/notes', async (req, res) => {
  const db = getPool();
  try {
    const leadId = req.params.id;
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    const noteId = uuidv4();
    await db.query(`
      INSERT INTO lead_interactions (id, lead_id, interaction_type, summary)
      VALUES (?, ?, ?, ?)
    `, [noteId, leadId, 'employee_note', note.trim()]);

    res.json({ success: true, id: noteId, message: 'Note added successfully' });
  } catch (err: any) {
    console.error('[CRM API] Add note error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Schedule follow-up task for lead
crmRouter.post('/leads/:id/tasks', async (req, res) => {
  const db = getPool();
  try {
    const leadId = req.params.id;
    const { title, description, due_date, priority, assigned_to } = req.body;
    if (!due_date) {
      return res.status(400).json({ success: false, error: 'Due date is required' });
    }

    const taskId = uuidv4();
    await db.query(`
      INSERT INTO tasks (id, title, description, due_date, priority, status, lead_id, assigned_to)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      taskId,
      title || 'Follow up with lead',
      description || null,
      due_date,
      priority || 'medium',
      leadId,
      assigned_to || null,
    ]);

    res.json({ success: true, id: taskId, message: 'Follow-up scheduled successfully' });
  } catch (err: any) {
    console.error('[CRM API] Schedule follow-up error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Customer Management ─────────────────────────────────────────

function validateEmail(email?: string): boolean {
  if (!email || !email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone?: string): boolean {
  if (!phone || !phone.trim()) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

crmRouter.get('/customers', async (req, res) => {
  const db = getPool();
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 15));
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const hasLeads = req.query.has_leads as string;
    const preferredContact = req.query.preferred_contact as string;
    const sortBy = req.query.sort as string;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim()) {
      conditions.push('(c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.current_location LIKE ?)');
      const q = `%${search.trim()}%`;
      params.push(q, q, q, q);
    }

    if (hasLeads === 'yes') {
      conditions.push('EXISTS (SELECT 1 FROM leads WHERE customer_id = c.id)');
    } else if (hasLeads === 'no') {
      conditions.push('NOT EXISTS (SELECT 1 FROM leads WHERE customer_id = c.id)');
    }

    if (preferredContact && preferredContact !== 'ALL') {
      conditions.push('LOWER(c.preferred_contact) = ?');
      params.push(preferredContact.toLowerCase());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRes] = await db.query(`SELECT COUNT(*) as total FROM customers c ${whereClause}`, params) as any;
    const total = Number(countRes?.[0]?.total || 0);

    let orderClause = 'ORDER BY c.created_at DESC';
    if (sortBy === 'name') {
      orderClause = 'ORDER BY c.full_name ASC';
    } else if (sortBy === 'leads') {
      orderClause = 'ORDER BY linked_leads_count DESC, c.created_at DESC';
    }

    const [customers] = await db.query(`
      SELECT c.*,
             (SELECT COUNT(*) FROM leads WHERE customer_id = c.id) as linked_leads_count,
             (SELECT MAX(created_at) FROM leads WHERE customer_id = c.id) as last_enquiry_date
      FROM customers c
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]) as any;

    res.json({
      success: true,
      data: customers || [],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err: any) {
    console.error('[CRM API] Customers fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create Customer with Server-side Validation
crmRouter.post('/customers', async (req, res) => {
  const db = getPool();
  try {
    const { full_name, phone, email, current_location, preferred_contact } = req.body;
    
    // Server-side validation
    if (!full_name || !full_name.trim() || full_name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Customer full name must be at least 2 characters.' });
    }

    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({ success: false, error: 'Valid phone number is required (7 to 15 digits).' });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format.' });
    }

    const normalizedPhone = phone.replace(/[^\d+]/g, '');

    // Duplicate check on phone
    const [existing] = await db.query('SELECT id, full_name FROM customers WHERE phone_normalized = ? LIMIT 1', [normalizedPhone]) as any;
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: `Customer profile already exists for ${existing[0].full_name} with phone ${phone}.`,
        existingId: existing[0].id,
      });
    }

    const id = uuidv4();
    await db.query(`
      INSERT INTO customers (id, full_name, phone, phone_normalized, email, current_location, preferred_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      full_name.trim(),
      phone.trim(),
      normalizedPhone,
      email && email.trim() ? email.trim() : null,
      current_location && current_location.trim() ? current_location.trim() : 'Chennai, India',
      preferred_contact || 'phone',
    ]);

    await db.query(`
      INSERT INTO audit_logs (id, actor_name, actor_role, action, record_type, record_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      (req.headers['x-user-role'] as string) || 'Admin',
      'Operations',
      'create',
      'customer',
      id,
      `Customer profile created for ${full_name.trim()} (${phone.trim()})`,
    ]);

    res.json({ success: true, id, message: 'Customer created successfully' });
  } catch (err: any) {
    console.error('[CRM API] Create customer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Customer with Server-side Validation
crmRouter.patch('/customers/:id', async (req, res) => {
  const db = getPool();
  try {
    const customerId = req.params.id;
    const { full_name, phone, email, current_location, preferred_contact } = req.body;

    const [existing] = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]) as any;
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    const current = existing[0];

    // Server-side validation
    const updatedName = full_name !== undefined ? String(full_name).trim() : current.full_name;
    if (!updatedName || updatedName.length < 2) {
      return res.status(400).json({ success: false, error: 'Customer full name must be at least 2 characters.' });
    }

    let updatedPhone = current.phone;
    let updatedNormPhone = current.phone_normalized;
    if (phone !== undefined) {
      if (!validatePhone(phone)) {
        return res.status(400).json({ success: false, error: 'Valid phone number is required (7 to 15 digits).' });
      }
      updatedPhone = String(phone).trim();
      updatedNormPhone = updatedPhone.replace(/[^\d+]/g, '');

      // Check collision with another customer
      const [duplicate] = await db.query('SELECT id, full_name FROM customers WHERE phone_normalized = ? AND id != ? LIMIT 1', [updatedNormPhone, customerId]) as any;
      if (duplicate && duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          error: `Another customer profile (${duplicate[0].full_name}) already has phone ${updatedPhone}.`,
        });
      }
    }

    let updatedEmail = current.email;
    if (email !== undefined) {
      if (email && !validateEmail(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email address format.' });
      }
      updatedEmail = email && email.trim() ? email.trim() : null;
    }

    const updatedLocation = current_location !== undefined ? String(current_location).trim() : current.current_location;
    const updatedContact = preferred_contact !== undefined ? String(preferred_contact) : current.preferred_contact;

    await db.query(`
      UPDATE customers
      SET full_name = ?, phone = ?, phone_normalized = ?, email = ?, current_location = ?, preferred_contact = ?
      WHERE id = ?
    `, [updatedName, updatedPhone, updatedNormPhone, updatedEmail, updatedLocation, updatedContact, customerId]);

    await db.query(`
      INSERT INTO audit_logs (id, actor_name, actor_role, action, record_type, record_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(),
      (req.headers['x-user-role'] as string) || 'Admin',
      'Operations',
      'update',
      'customer',
      customerId,
      `Customer profile updated for ${updatedName}`,
    ]);

    res.json({
      success: true,
      message: 'Customer profile updated successfully',
      data: {
        id: customerId,
        full_name: updatedName,
        phone: updatedPhone,
        phone_normalized: updatedNormPhone,
        email: updatedEmail,
        current_location: updatedLocation,
        preferred_contact: updatedContact,
      },
    });
  } catch (err: any) {
    console.error('[CRM API] Update customer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Customer Detail View (7 tabs support)
crmRouter.get('/customers/:id', async (req, res) => {
  const db = getPool();
  try {
    const customerId = req.params.id;
    const [custRows] = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]) as any;
    if (!custRows || custRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    const customer = custRows[0];

    // Linked leads
    const [leads] = await db.query('SELECT * FROM leads WHERE customer_id = ? ORDER BY created_at DESC', [customerId]) as any;

    // Linked conversations & messages
    const [convos] = await db.query(`
      SELECT * FROM conversations WHERE customer_id = ? ORDER BY started_at DESC
    `, [customerId]) as any;

    const convosWithMessages = [];
    for (const c of convos || []) {
      const [msgs] = await db.query(`
        SELECT * FROM conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC
      `, [c.id]) as any;
      convosWithMessages.push({ ...c, messages: msgs || [] });
    }

    // Follow-ups & tasks
    const [tasks] = await db.query(`
      SELECT t.*, e.full_name as assignee_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      WHERE t.customer_id = ?
      ORDER BY t.due_date ASC
    `, [customerId]) as any;

    // Site visits
    const [visits] = await db.query(`
      SELECT sv.*, p.title as property_title, e.full_name as employee_name
      FROM site_visits sv
      LEFT JOIN properties p ON sv.property_id = p.id
      LEFT JOIN employees e ON sv.employee_id = e.id
      WHERE sv.customer_id = ?
      ORDER BY sv.visit_date DESC
    `, [customerId]) as any;

    // Deals
    const [deals] = await db.query(`
      SELECT d.*, p.title as property_title, e.full_name as agent_name
      FROM deals d
      LEFT JOIN properties p ON d.property_id = p.id
      LEFT JOIN employees e ON d.agent_id = e.id
      WHERE d.customer_id = ?
      ORDER BY d.created_at DESC
    `, [customerId]) as any;

    res.json({
      success: true,
      data: {
        ...customer,
        leads: leads || [],
        conversations: convosWithMessages || [],
        tasks: tasks || [],
        visits: visits || [],
        deals: deals || [],
      },
    });
  } catch (err: any) {
    console.error('[CRM API] Get customer detail error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Property Management ─────────────────────────────────────────
crmRouter.get('/properties', async (req, res) => {
  const db = getPool();
  try {
    const [properties] = await db.query('SELECT * FROM properties ORDER BY created_at DESC LIMIT 50') as any;
    res.json({ success: true, data: properties || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Land Management ─────────────────────────────────────────────
crmRouter.get('/land', async (req, res) => {
  const db = getPool();
  try {
    const [land] = await db.query('SELECT * FROM land_listings ORDER BY created_at DESC LIMIT 50') as any;
    res.json({ success: true, data: land || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. Deals & Pipeline ────────────────────────────────────────────
crmRouter.get('/deals', async (_req, res) => {
  const db = getPool();
  try {
    const [deals] = await db.query(`
      SELECT d.*, l.full_name as prospect_name, p.title as property_title, e.full_name as agent_name
      FROM deals d
      LEFT JOIN leads l ON d.lead_id = l.id
      LEFT JOIN properties p ON d.property_id = p.id
      LEFT JOIN employees e ON d.agent_id = e.id
      ORDER BY d.created_at DESC
      LIMIT 50
    `) as any;
    res.json({ success: true, data: deals || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 7. Appointments & Site Visits ──────────────────────────────────
crmRouter.get('/site-visits', async (_req, res) => {
  const db = getPool();
  try {
    const [visits] = await db.query(`
      SELECT sv.*, l.full_name as lead_name, l.phone as lead_phone,
             p.title as property_title, e.full_name as employee_name
      FROM site_visits sv
      LEFT JOIN leads l ON sv.lead_id = l.id
      LEFT JOIN properties p ON sv.property_id = p.id
      LEFT JOIN employees e ON sv.employee_id = e.id
      ORDER BY sv.visit_date DESC
      LIMIT 50
    `) as any;
    res.json({ success: true, data: visits || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 8. Tasks & Follow-ups ──────────────────────────────────────────
crmRouter.get('/tasks', async (_req, res) => {
  const db = getPool();
  try {
    const [tasks] = await db.query(`
      SELECT t.*, e.full_name as assignee_name, l.full_name as lead_name
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      LEFT JOIN leads l ON t.lead_id = l.id
      ORDER BY t.due_date ASC
      LIMIT 50
    `) as any;
    res.json({ success: true, data: tasks || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

crmRouter.patch('/tasks/:id/complete', async (req, res) => {
  const db = getPool();
  try {
    const taskId = req.params.id;
    const { completion_notes } = req.body;
    await db.query(`
      UPDATE tasks SET status = 'completed', completion_notes = ? WHERE id = ?
    `, [completion_notes || 'Marked completed by employee', taskId]);
    res.json({ success: true, message: 'Task marked as completed' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

crmRouter.post('/tasks', async (req, res) => {
  const db = getPool();
  try {
    const { title, description, due_date, priority, lead_id, customer_id, assigned_to } = req.body;
    if (!title || !due_date) {
      return res.status(400).json({ success: false, error: 'Title and due date are required' });
    }
    const id = uuidv4();
    await db.query(`
      INSERT INTO tasks (id, title, description, due_date, priority, status, lead_id, customer_id, assigned_to)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `, [id, title, description || null, due_date, priority || 'medium', lead_id || null, customer_id || null, assigned_to || null]);
    res.json({ success: true, id, message: 'Task created successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 9. Employees & Teams ───────────────────────────────────────────
crmRouter.get('/employees', requireRoles(['Super Admin', 'Admin', 'Sales Manager']), async (_req, res) => {
  const db = getPool();
  try {
    const [employees] = await db.query(`
      SELECT e.*, t.name as team_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.id
      ORDER BY e.created_at ASC
    `) as any;
    res.json({ success: true, data: employees || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

crmRouter.get('/teams', requireRoles(['Super Admin', 'Admin', 'Sales Manager']), async (_req, res) => {
  const db = getPool();
  try {
    const [teams] = await db.query('SELECT * FROM teams ORDER BY name ASC') as any;
    res.json({ success: true, data: teams || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 10. Rewards Ledger & Points ────────────────────────────────────
crmRouter.get('/rewards', async (_req, res) => {
  const db = getPool();
  try {
    const [rewards] = await db.query(`
      SELECT r.*, e.full_name as employee_name
      FROM reward_ledger r
      JOIN employees e ON r.employee_id = e.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `) as any;
    res.json({ success: true, data: rewards || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 11. Marketing Campaigns ────────────────────────────────────────
crmRouter.get('/campaigns', requireRoles(['Super Admin', 'Admin', 'Marketing Executive']), async (_req, res) => {
  const db = getPool();
  try {
    const [campaigns] = await db.query('SELECT * FROM campaigns ORDER BY created_at DESC') as any;
    res.json({ success: true, data: campaigns || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 12. In-App Notifications ───────────────────────────────────────
crmRouter.get('/notifications', async (_req, res) => {
  const db = getPool();
  try {
    const [notifs] = await db.query('SELECT * FROM crm_notifications ORDER BY created_at DESC LIMIT 20') as any;
    res.json({ success: true, data: notifs || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 13. Audit Logs (Restricted to Super Admin & Admin) ─────────────
crmRouter.get('/audit-logs', requireRoles(['Super Admin', 'Admin']), async (_req, res) => {
  const db = getPool();
  try {
    const [logs] = await db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50') as any;
    res.json({ success: true, data: logs || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

crmRouter.post('/audit-logs', requireRoles(['Super Admin', 'Admin']), async (req, res) => {
  const db = getPool();
  const { actor_name, actor_role, action, record_type, record_id, details } = req.body;
  try {
    const id = uuidv4();
    await db.query(`
      INSERT INTO audit_logs (id, actor_name, actor_role, action, record_type, record_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, actor_name || 'System User', actor_role || 'Developer', action || 'action', record_type || 'general', record_id || null, details || '']);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 14. CRM Settings (Restricted to Super Admin & Admin) ───────────
crmRouter.get('/settings', requireRoles(['Super Admin', 'Admin']), async (_req, res) => {
  const db = getPool();
  try {
    const [rows] = await db.query('SELECT * FROM crm_settings') as any;
    const settings: Record<string, any> = {};
    for (const r of rows || []) {
      settings[r.setting_key] = typeof r.setting_value === 'string' ? JSON.parse(r.setting_value) : r.setting_value;
    }
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

crmRouter.patch('/settings', requireRoles(['Super Admin', 'Admin']), async (req, res) => {
  const db = getPool();
  try {
    const { setting_key, setting_value } = req.body;
    if (!setting_key || setting_value === undefined) {
      return res.status(400).json({ success: false, error: 'setting_key and setting_value are required' });
    }
    await db.query(`
      INSERT INTO crm_settings (setting_key, setting_value)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE setting_value = ?
    `, [setting_key, JSON.stringify(setting_value), JSON.stringify(setting_value)]);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 15. User Management & Security Matrix (Super Admin Only) ───────
crmRouter.get('/users', requireRoles(['Super Admin']), async (_req, res) => {
  const db = getPool();
  try {
    const [users] = await db.query(`
      SELECT e.id, e.full_name, e.email, e.phone, e.department, e.role, e.employment_status,
             e.assigned_territory, e.monthly_target, e.points_balance, e.created_at,
             t.name as team_name
      FROM employees e
      LEFT JOIN teams t ON e.team_id = t.id
      ORDER BY e.created_at ASC
    `) as any;
    res.json({
      success: true,
      data: users || [],
      scope: 'Global Executive Access',
      totalUsers: (users || []).length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

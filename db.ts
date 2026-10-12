/**
 * db.ts — MySQL connection pool + safe schema initialization for Lyka CRM
 * Uses CREATE TABLE IF NOT EXISTS — never drops existing tables.
 */
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lyka_crm',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }
  return pool;
}

/** Test connectivity — returns true if MySQL is reachable */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const conn = await getPool().getConnection();
    await conn.ping();
    conn.release();
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

/**
 * Safe schema migration — CREATE TABLE IF NOT EXISTS only.
 * Never drops tables. Never erases data. Idempotent.
 */
export async function initSchema(): Promise<void> {
  const db = getPool();

  // Create database if it doesn't exist (for fresh XAMPP installs)
  const dbName = process.env.DB_NAME || 'lyka_crm';
  await db.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await db.query(`USE \`${dbName}\``);

  await db.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255),
      phone VARCHAR(50),
      phone_normalized VARCHAR(50),
      email VARCHAR(255),
      current_location VARCHAR(500),
      preferred_contact VARCHAR(50) DEFAULT 'phone',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_phone (phone_normalized),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36),
      guest_session_id VARCHAR(36),
      lead_source VARCHAR(100),
      intent VARCHAR(100),
      property_type VARCHAR(100),
      country VARCHAR(100),
      state_province VARCHAR(100),
      city VARCHAR(100),
      locality VARCHAR(255),
      postal_code VARCHAR(20),
      original_location TEXT,
      property_size VARCHAR(100),
      area_unit VARCHAR(50),
      budget_min DECIMAL(18,2),
      budget_max DECIMAL(18,2),
      currency VARCHAR(10),
      rental_period VARCHAR(50),
      bedrooms VARCHAR(20),
      bathrooms VARCHAR(20),
      amenities TEXT,
      timeline VARCHAR(100),
      temperature VARCHAR(20) DEFAULT 'WARM',
      pipeline_status VARCHAR(50) DEFAULT 'new',
      assigned_agent VARCHAR(36),
      additional_prefs TEXT,
      full_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_customer (customer_id),
      INDEX idx_session (guest_session_id),
      INDEX idx_temp (temperature)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(36) PRIMARY KEY,
      lead_id VARCHAR(36),
      customer_id VARCHAR(36),
      session_id VARCHAR(36) NOT NULL,
      channel VARCHAR(20) NOT NULL DEFAULT 'text',
      language VARCHAR(20) DEFAULT 'english',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      INDEX idx_lead (lead_id),
      INDEX idx_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id VARCHAR(36) PRIMARY KEY,
      conversation_id VARCHAR(36) NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT,
      message_type VARCHAR(20) DEFAULT 'text',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_convo (conversation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS lead_interactions (
      id VARCHAR(36) PRIMARY KEY,
      lead_id VARCHAR(36) NOT NULL,
      interaction_type VARCHAR(50) NOT NULL,
      summary TEXT,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_lead (lead_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // ── CRM Enterprise Entities ──────────────────────────────────────────

  await db.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      department VARCHAR(100),
      manager_id VARCHAR(36),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      department VARCHAR(100) DEFAULT 'Sales',
      role VARCHAR(100) DEFAULT 'Sales Agent',
      team_id VARCHAR(36),
      reporting_manager_id VARCHAR(36),
      employment_status VARCHAR(50) DEFAULT 'active',
      assigned_territory VARCHAR(255),
      monthly_target DECIMAL(18,2) DEFAULT 0,
      points_balance INT DEFAULT 0,
      avatar_url VARCHAR(1000),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_emp_email (email),
      INDEX idx_emp_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      purpose VARCHAR(50) DEFAULT 'sale',
      property_type VARCHAR(100) DEFAULT 'apartment',
      status VARCHAR(50) DEFAULT 'available',
      country VARCHAR(100) DEFAULT 'India',
      state_province VARCHAR(100),
      city VARCHAR(100),
      locality VARCHAR(255),
      address TEXT,
      postal_code VARCHAR(20),
      building_name VARCHAR(255),
      price DECIMAL(18,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      rental_frequency VARCHAR(50),
      bedrooms VARCHAR(20),
      bathrooms VARCHAR(20),
      built_up_area DECIMAL(12,2),
      plot_area DECIMAL(12,2),
      area_unit VARCHAR(50) DEFAULT 'sqft',
      furnishing VARCHAR(50),
      parking VARCHAR(50),
      amenities JSON,
      cover_image_url VARCHAR(1000),
      images JSON,
      owner_id VARCHAR(36),
      assigned_agent_id VARCHAR(36),
      verification_status VARCHAR(50) DEFAULT 'approved',
      quality_score INT DEFAULT 85,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_prop_status (status),
      INDEX idx_prop_city (city),
      INDEX idx_prop_type (property_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS land_listings (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      land_type VARCHAR(100) DEFAULT 'residential_land',
      status VARCHAR(50) DEFAULT 'available',
      country VARCHAR(100) DEFAULT 'India',
      state_province VARCHAR(100),
      district VARCHAR(100),
      city VARCHAR(100),
      village VARCHAR(100),
      locality VARCHAR(255),
      survey_number VARCHAR(100),
      total_area DECIMAL(14,4) DEFAULT 0,
      area_unit VARCHAR(50) DEFAULT 'cents',
      expected_price DECIMAL(18,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      price_basis VARCHAR(50) DEFAULT 'total',
      road_access VARCHAR(100),
      frontage VARCHAR(100),
      zoning VARCHAR(100),
      water_availability BOOLEAN DEFAULT true,
      electricity_availability BOOLEAN DEFAULT true,
      ownership_status VARCHAR(100) DEFAULT 'Freehold',
      verification_status VARCHAR(50) DEFAULT 'verified',
      owner_id VARCHAR(36),
      assigned_agent_id VARCHAR(36),
      images JSON,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_land_status (status),
      INDEX idx_land_city (city)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS deals (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      lead_id VARCHAR(36),
      customer_id VARCHAR(36),
      property_id VARCHAR(36),
      land_id VARCHAR(36),
      agent_id VARCHAR(36),
      manager_id VARCHAR(36),
      transaction_type VARCHAR(50) DEFAULT 'buy',
      deal_status VARCHAR(50) DEFAULT 'in_negotiation',
      deal_value DECIMAL(18,2) DEFAULT 0,
      projected_value DECIMAL(18,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      commission_rate DECIMAL(5,2) DEFAULT 2.00,
      commission_amount DECIMAL(18,2) DEFAULT 0,
      expected_close_date DATE,
      actual_close_date DATE,
      payment_status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_deal_status (deal_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36),
      lead_id VARCHAR(36),
      property_id VARCHAR(36),
      land_id VARCHAR(36),
      employee_id VARCHAR(36),
      visit_date DATE NOT NULL,
      visit_time VARCHAR(20) NOT NULL,
      status VARCHAR(50) DEFAULT 'scheduled',
      feedback TEXT,
      outcome VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visit_date (visit_date),
      INDEX idx_visit_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to VARCHAR(36),
      lead_id VARCHAR(36),
      customer_id VARCHAR(36),
      deal_id VARCHAR(36),
      due_date DATE NOT NULL,
      priority VARCHAR(20) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'pending',
      completion_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_task_due (due_date),
      INDEX idx_task_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS reward_ledger (
      id VARCHAR(36) PRIMARY KEY,
      employee_id VARCHAR(36) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      points INT NOT NULL,
      direction VARCHAR(10) DEFAULT 'credit',
      source_event_id VARCHAR(36),
      reason TEXT,
      actor_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reward_emp (employee_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      source_channel VARCHAR(100) DEFAULT 'Meta Ads',
      status VARCHAR(50) DEFAULT 'active',
      start_date DATE,
      end_date DATE,
      budget DECIMAL(18,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      leads_generated INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS crm_notifications (
      id VARCHAR(36) PRIMARY KEY,
      recipient_role VARCHAR(100),
      recipient_employee_id VARCHAR(36),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      link_module VARCHAR(100),
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      actor_name VARCHAR(255),
      actor_role VARCHAR(100),
      action VARCHAR(100) NOT NULL,
      record_type VARCHAR(100) NOT NULL,
      record_id VARCHAR(36),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_time (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS crm_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Seed default employees for dev role preview if none exist
  const [empCount] = await db.query('SELECT COUNT(*) as c FROM employees') as any;
  if (empCount?.[0]?.c === 0) {
    await db.query(`
      INSERT INTO employees (id, full_name, email, department, role, monthly_target, points_balance, assigned_territory) VALUES
      ('emp-super-admin', 'Rajesh K. Varma', 'rajesh.varma@lykarealty.com', 'Executive', 'Super Admin', 150000000, 3200, 'Global / Chennai HQ'),
      ('emp-admin', 'Kavitha Ramachandran', 'kavitha.r@lykarealty.com', 'Operations', 'Admin', 80000000, 2400, 'Tamil Nadu Region'),
      ('emp-sales-mgr', 'Arunachalam Sundaram', 'arun.sundaram@lykarealty.com', 'Sales', 'Sales Manager', 100000000, 1850, 'Chennai Luxury Corridor'),
      ('emp-lead-lead', 'Deepa Jayakumar', 'deepa.j@lykarealty.com', 'Lead Management', 'Lead Management Team', 50000000, 1600, 'Inbound Digital Leads'),
      ('emp-sales-agent', 'Vinakya Mahadev', 'vinakya.m@lykarealty.com', 'Sales', 'Sales Agent', 40000000, 1200, 'OMR & ECR Coastal Plots'),
      ('emp-marketing', 'Siddharth Menon', 'siddharth.m@lykarealty.com', 'Marketing', 'Marketing Executive', 30000000, 950, 'Social & Portal Campaigns')
    `);
  }

  // Seed initial organization settings if none exist
  const [setCount] = await db.query('SELECT COUNT(*) as c FROM crm_settings') as any;
  if (setCount?.[0]?.c === 0) {
    await db.query(`
      INSERT INTO crm_settings (setting_key, setting_value) VALUES
      ('organization', JSON_OBJECT('name', 'Lyka Realty Global', 'headquarters', 'Chennai, Tamil Nadu', 'defaultCurrency', 'INR', 'supportEmail', 'contact@lykarealty.com')),
      ('lead_scoring', JSON_OBJECT('hotMinScore', 80, 'warmMinScore', 50, 'budgetWeight', 30, 'timelineWeight', 35, 'intentWeight', 35)),
      ('currencies', JSON_ARRAY('INR', 'AED', 'USD', 'GBP', 'EUR', 'SGD')),
      ('units', JSON_ARRAY('sqft', 'cents', 'acres', 'grounds', 'sqm', 'sqyd'))
    `);
  }

  console.log('[DB] CRM Schema verified (CREATE TABLE IF NOT EXISTS — existing tables and data untouched).');
}

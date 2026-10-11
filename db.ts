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

  console.log('[DB] Schema initialized (CREATE TABLE IF NOT EXISTS — no data erased).');
}

import { commissionsDb } from "@/lib/db";

export interface ActivityLogInput {
  user_id?: number | null;
  member_id?: number | null;
  user_name?: string | null;
  user_email?: string | null;
  role_name?: string | null;
  action_type: string;
  module_name: string;
  description: string;
  metadata?: any;
  ip_address?: string | null;
  user_agent?: string | null;
}

export async function ensureActivityLogsTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS site_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      member_id INT NULL,
      user_name VARCHAR(255) NULL,
      user_email VARCHAR(255) NULL,
      role_name VARCHAR(100) NULL,
      action_type VARCHAR(100) NOT NULL,
      module_name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      metadata JSON NULL,
      ip_address VARCHAR(100) NULL,
      user_agent TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_action_type (action_type),
      INDEX idx_module_name (module_name),
      INDEX idx_user_email (user_email),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function logSiteActivity(input: ActivityLogInput) {
  try {
    await ensureActivityLogsTable();
    await commissionsDb.query(`
      INSERT INTO site_activity_logs 
      (user_id, member_id, user_name, user_email, role_name, action_type, module_name, description, metadata, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      input.user_id || null,
      input.member_id || null,
      input.user_name || null,
      input.user_email || null,
      input.role_name || null,
      input.action_type,
      input.module_name,
      input.description,
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.ip_address || null,
      input.user_agent || null,
    ]);
  } catch (err) {
    console.error("Failed to record site activity log:", err);
  }
}

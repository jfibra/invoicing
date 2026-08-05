import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface CategoryRecord {
  id: number;
  name: string;
  code?: string | null;
  type: "PURCHASE" | "SALES";
  description?: string | null;
  status: "active" | "inactive";
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function ensureCategoriesTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NULL,
      type ENUM('PURCHASE', 'SALES') NOT NULL,
      description TEXT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Check if seed data exists
  const [rows] = await commissionsDb.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM categories");
  const count = rows[0]?.count || 0;

  if (count === 0) {
    const defaultCategories = [
      // Sales categories
      { name: "Real Estate Sales Commission", code: "CAT-SALES-COMM", type: "SALES", description: "Brokerage commission revenue from property sales", status: "active" },
      { name: "Consulting & Service Fees", code: "CAT-SALES-CONS", type: "SALES", description: "Real estate transaction and advisory fee revenue", status: "active" },
      { name: "Listing & Management Fees", code: "CAT-SALES-MGMT", type: "SALES", description: "Property management and listing retainer revenue", status: "active" },
      
      // Purchase categories
      { name: "Agent Payouts & Commission Split", code: "CAT-PURCH-PAY", type: "PURCHASE", description: "Commission splits disbursed to real estate agents", status: "active" },
      { name: "Marketing & Advertising", code: "CAT-PURCH-MKTG", type: "PURCHASE", description: "Property lead generation, portals, and marketing costs", status: "active" },
      { name: "Office Supplies & Admin Expenses", code: "CAT-PURCH-OFFICE", type: "PURCHASE", description: "General office, utility, and administrative operational expenses", status: "active" },
      { name: "Software & Technology Subscriptions", code: "CAT-PURCH-TECH", type: "PURCHASE", description: "CRM, hosting, software licenses, and IT subscriptions", status: "active" },
    ];

    for (const cat of defaultCategories) {
      await commissionsDb.query(
        `INSERT INTO categories (name, code, type, description, status) VALUES (?, ?, ?, ?, ?)`,
        [cat.name, cat.code, cat.type, cat.description, cat.status]
      );
    }
  }
}

export async function getCategories(
  type?: "PURCHASE" | "SALES",
  includeDeleted: boolean = false
): Promise<CategoryRecord[]> {
  await ensureCategoriesTable();
  let query = "SELECT * FROM categories WHERE 1=1";
  const params: any[] = [];

  if (!includeDeleted) {
    query += " AND deleted_at IS NULL";
  }

  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY type ASC, name ASC";

  const [rows] = await commissionsDb.query<RowDataPacket[]>(query, params);
  return rows as CategoryRecord[];
}

import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface InvoiceTypeRecord {
  id: number;
  code: string;
  label: string;
  invoice_title: string;
  description: string;
  status: "active" | "inactive";
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export async function ensureInvoiceTypesTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS invoice_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      label VARCHAR(100) NOT NULL,
      invoice_title VARCHAR(100) NOT NULL,
      description TEXT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Check if initial seed data exists
  const [rows] = await commissionsDb.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM invoice_types");
  const count = rows[0]?.count || 0;

  if (count === 0) {
    const defaultTypes = [
      {
        code: "TAX_INVOICE",
        label: "Tax Invoice",
        invoice_title: "TAX INVOICE",
        description: "Real Estate Sales Commission Service Fee",
        sort_order: 1,
      },
      {
        code: "AGENT_PAYOUT",
        label: "Agent Payout",
        invoice_title: "AGENT PAYOUT STATEMENT",
        description: "Brokerage Agent Commission Split Payout",
        sort_order: 2,
      },
      {
        code: "PARTIAL_TRANCHE",
        label: "Partial Tranche",
        invoice_title: "PARTIAL TRANCHE INVOICE",
        description: "Commission Tranche Milestone Release",
        sort_order: 3,
      },
      {
        code: "PROFORMA",
        label: "Proforma Invoice",
        invoice_title: "PROFORMA INVOICE",
        description: "Proforma Estimated Sales Commission Fee",
        sort_order: 4,
      },
    ];

    for (const item of defaultTypes) {
      await commissionsDb.query(
        `INSERT INTO invoice_types (code, label, invoice_title, description, sort_order) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE label=VALUES(label), invoice_title=VALUES(invoice_title), description=VALUES(description)`,
        [item.code, item.label, item.invoice_title, item.description, item.sort_order]
      );
    }
  }
}

export async function getAllInvoiceTypes(): Promise<InvoiceTypeRecord[]> {
  await ensureInvoiceTypesTable();
  const [rows] = await commissionsDb.query<RowDataPacket[]>(
    "SELECT * FROM invoice_types ORDER BY sort_order ASC, id ASC"
  );
  return rows as InvoiceTypeRecord[];
}

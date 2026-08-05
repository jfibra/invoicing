import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface InvoiceFileCategoryRecord {
  id: number;
  name: string;
  code?: string | null;
  type: "PURCHASE" | "SALES";
  description?: string | null;
  is_required: boolean | number;
  status: "active" | "inactive";
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function ensureInvoiceFileCategoriesTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS invoice_file_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50) NULL,
      type ENUM('PURCHASE', 'SALES') NOT NULL,
      description TEXT NULL,
      is_required TINYINT(1) DEFAULT 0,
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
  const [rows] = await commissionsDb.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM invoice_file_categories");
  const count = rows[0]?.count || 0;

  if (count === 0) {
    const defaultFileCategories = [
      // Sales Invoice File Categories
      {
        name: "Sales & Purchase Agreement (SPA)",
        code: "FILE-SALES-SPA",
        type: "SALES",
        description: "Signed Sales & Purchase Agreement between buyer and developer/seller",
        is_required: 1,
        status: "active",
      },
      {
        name: "Official Payment Receipt / Proof of Payment",
        code: "FILE-SALES-RCPT",
        type: "SALES",
        description: "Official payment receipt or bank deposit proof for commission/deal payment",
        is_required: 1,
        status: "active",
      },
      {
        name: "Agent / Client Passport & Emirates ID",
        code: "FILE-SALES-ID",
        type: "SALES",
        description: "Identification documents (Passport, Emirates ID) for compliance and KYC",
        is_required: 0,
        status: "active",
      },
      {
        name: "VAT Certificate / TRN Proof",
        code: "FILE-SALES-VAT",
        type: "SALES",
        description: "Tax Registration Number (TRN) certificate for VAT invoicing compliance",
        is_required: 0,
        status: "active",
      },
      {
        name: "Bank Transfer Advice & Deposit Slip",
        code: "FILE-SALES-BANK",
        type: "SALES",
        description: "Wire transfer confirmation or bank deposit receipt",
        is_required: 0,
        status: "active",
      },

      // Purchase Invoice File Categories
      {
        name: "Vendor Tax Invoice / Bill",
        code: "FILE-PURCH-INV",
        type: "PURCHASE",
        description: "Official tax invoice or bill issued by vendor or developer",
        is_required: 1,
        status: "active",
      },
      {
        name: "Agent Commission Claim Form / Invoice",
        code: "FILE-PURCH-CLAIM",
        type: "PURCHASE",
        description: "Signed commission payout claim form or invoice submitted by agent",
        is_required: 1,
        status: "active",
      },
      {
        name: "Agent / Vendor Trade License & TRN",
        code: "FILE-PURCH-LIC",
        type: "PURCHASE",
        description: "Trade license copy and VAT TRN certificate of vendor or partner brokerage",
        is_required: 0,
        status: "active",
      },
      {
        name: "Payment Voucher & Bank Transfer Advice",
        code: "FILE-PURCH-BANK",
        type: "PURCHASE",
        description: "Disbursement voucher and wire transfer confirmation paid to vendor/agent",
        is_required: 0,
        status: "active",
      },
      {
        name: "Expense Receipt & Supporting Vouchers",
        code: "FILE-PURCH-RCPT",
        type: "PURCHASE",
        description: "Itemized expense receipts and supporting vouchers for reimbursement",
        is_required: 0,
        status: "active",
      },
    ];

    for (const cat of defaultFileCategories) {
      await commissionsDb.query(
        `INSERT INTO invoice_file_categories (name, code, type, description, is_required, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [cat.name, cat.code, cat.type, cat.description, cat.is_required, cat.status]
      );
    }
  }
}

export async function getInvoiceFileCategories(
  type?: "PURCHASE" | "SALES",
  includeDeleted: boolean = false
): Promise<InvoiceFileCategoryRecord[]> {
  await ensureInvoiceFileCategoriesTable();
  let query = "SELECT * FROM invoice_file_categories WHERE 1=1";
  const params: any[] = [];

  if (!includeDeleted) {
    query += " AND deleted_at IS NULL";
  }

  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY type ASC, is_required DESC, name ASC";

  const [rows] = await commissionsDb.query<RowDataPacket[]>(query, params);
  return rows as InvoiceFileCategoryRecord[];
}

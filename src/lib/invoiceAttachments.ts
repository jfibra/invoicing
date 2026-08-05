import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface InvoiceFileRecord {
  id: number;
  invoice_id: number;
  invoice_number: string;
  category_id?: number | null;
  category_code?: string | null;
  category_name: string;
  file_name: string;
  s3_key: string;
  s3_url: string;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_at?: string;
}

export async function ensureInvoiceFilesTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS generated_invoice_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT NOT NULL,
      invoice_number VARCHAR(100) NOT NULL,
      category_id INT NULL,
      category_code VARCHAR(50) NULL,
      category_name VARCHAR(150) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      s3_key VARCHAR(500) NOT NULL,
      s3_url VARCHAR(500) NOT NULL,
      file_size INT NULL,
      mime_type VARCHAR(100) NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_invoice_id (invoice_id),
      INDEX idx_invoice_number (invoice_number),
      INDEX idx_category_id (category_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export async function getInvoiceAttachments(invoiceId: number): Promise<InvoiceFileRecord[]> {
  await ensureInvoiceFilesTable();
  const [rows] = await commissionsDb.query<RowDataPacket[]>(
    "SELECT * FROM generated_invoice_files WHERE invoice_id = ? ORDER BY id DESC",
    [invoiceId]
  );
  return rows as InvoiceFileRecord[];
}

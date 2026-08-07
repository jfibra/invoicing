import { commissionsDb } from "@/lib/db";

export async function ensureSalesTables() {
  // 1. Sales Master Table
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sale_number VARCHAR(100) NOT NULL UNIQUE,
      sale_date DATE NOT NULL,
      tax_type ENUM('VAT', 'NONVAT') DEFAULT 'VAT',
      invoice_number VARCHAR(100) NULL,
      
      /* Client / Customer & TRN Library linkage */
      trn_record_id INT NULL,
      customer_name VARCHAR(255) NOT NULL,
      tin_number VARCHAR(100) NULL,
      
      /* Category & VAT Treatment */
      category_name VARCHAR(255) NOT NULL DEFAULT 'COMMISSION SALES',
      subcategory_name VARCHAR(255) NOT NULL DEFAULT 'Real Estate Brokerage',
      vat_treatment VARCHAR(100) DEFAULT 'Standard Rate (5%)',
      
      /* Amounts */
      amount DECIMAL(15,2) NOT NULL DEFAULT 0.00, /* Net amount */
      vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      gross_taxable DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      total_actual_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      
      /* Member & Team Attribution */
      member_id INT NULL,
      member_code VARCHAR(100) NULL,
      fullname VARCHAR(255) NULL,
      team VARCHAR(255) NULL,
      subteam VARCHAR(255) NULL,
      
      payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
      remarks TEXT NULL,
      status VARCHAR(50) DEFAULT 'RECORDED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_sale_num (sale_number),
      INDEX idx_sale_date (sale_date),
      INDEX idx_customer (customer_name),
      INDEX idx_tin (tin_number),
      INDEX idx_trn_id (trn_record_id),
      INDEX idx_cat (category_name),
      INDEX idx_subcat (subcategory_name),
      INDEX idx_vat_treat (vat_treatment),
      INDEX idx_member (member_id),
      INDEX idx_team (team),
      INDEX idx_subteam (subteam)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Sales File Attachments Table
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS sale_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sale_id INT NOT NULL,
      file_category_id INT NULL,
      file_category_code VARCHAR(100) NULL,
      file_category_name VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT DEFAULT 0,
      mime_type VARCHAR(100) NULL,
      uploaded_by VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      INDEX idx_sale_id (sale_id),
      INDEX idx_file_cat (file_category_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

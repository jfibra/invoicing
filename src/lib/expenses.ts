import { commissionsDb } from "@/lib/db";
import { ensureExpenseCategoriesTables } from "./expenseCategories";

export async function ensureExpensesTables() {
  await ensureExpenseCategoriesTables();

  // 1. Expenses Master Table
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expense_number VARCHAR(100) NOT NULL UNIQUE,
      expense_date DATE NOT NULL,
      tax_type ENUM('VAT', 'NONVAT') DEFAULT 'VAT',
      invoice_number VARCHAR(100) NULL,
      
      /* Company & TRN Library linkage */
      trn_record_id INT NULL,
      company_name VARCHAR(255) NOT NULL,
      tin_number VARCHAR(100) NULL,
      
      /* Expense Category linkage */
      expense_category_id INT NULL,
      category_name VARCHAR(255) NOT NULL,
      subcategory_name VARCHAR(255) NOT NULL,
      vat_treatment VARCHAR(100) DEFAULT 'Recoverable',
      
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
      
      INDEX idx_exp_num (expense_number),
      INDEX idx_exp_date (expense_date),
      INDEX idx_company (company_name),
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

  // 2. Expense File Attachments Table
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS expense_attachments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expense_id INT NOT NULL,
      file_category_id INT NULL,
      file_category_code VARCHAR(100) NULL,
      file_category_name VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      file_size BIGINT DEFAULT 0,
      mime_type VARCHAR(100) NULL,
      uploaded_by VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      INDEX idx_exp_id (expense_id),
      INDEX idx_file_cat (file_category_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure columns exist if table was already created earlier
  const columnsToAdd = [
    { name: "tax_type", type: "ENUM('VAT', 'NONVAT') DEFAULT 'VAT'" },
    { name: "trn_record_id", type: "INT NULL" },
    { name: "company_name", type: "VARCHAR(255) NULL" },
    { name: "tin_number", type: "VARCHAR(100) NULL" },
    { name: "gross_taxable", type: "DECIMAL(15,2) NOT NULL DEFAULT 0.00" },
    { name: "total_actual_amount", type: "DECIMAL(15,2) NOT NULL DEFAULT 0.00" },
    { name: "member_id", type: "INT NULL" },
    { name: "member_code", type: "VARCHAR(100) NULL" },
    { name: "fullname", type: "VARCHAR(255) NULL" },
    { name: "team", type: "VARCHAR(255) NULL" },
    { name: "subteam", type: "VARCHAR(255) NULL" },
  ];

  for (const col of columnsToAdd) {
    try {
      await commissionsDb.query(`ALTER TABLE expenses ADD COLUMN ${col.name} ${col.type}`);
    } catch (e: any) {
      // Column likely already exists
    }
  }
}

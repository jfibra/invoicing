import { commissionsDb } from "@/lib/db";
import seedData from "./vat_expense_seed.json";

export async function ensureExpenseCategoriesTables() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_name VARCHAR(255) NOT NULL,
      subcategory_name VARCHAR(255) NOT NULL,
      vat_treatment VARCHAR(100) DEFAULT 'Recoverable',
      description TEXT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category_name),
      INDEX idx_subcategory (subcategory_name),
      INDEX idx_treatment (vat_treatment),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Check if seed data exists
  const [rows] = await commissionsDb.query<any[]>("SELECT COUNT(*) as total FROM expense_categories");
  if (rows[0]?.total === 0) {
    console.log("Seeding expense_categories table from VAT Expense Checklist...");
    for (const item of seedData) {
      await commissionsDb.query(
        `INSERT INTO expense_categories (category_name, subcategory_name, vat_treatment, description, status) 
         VALUES (?, ?, ?, ?, 'active')`,
        [item.category_name, item.subcategory_name, item.vat_treatment, item.description || null]
      );
    }
    console.log("Seeded", seedData.length, "expense categories.");
  }
}

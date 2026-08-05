import { commissionsDb } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface DeveloperRecord {
  id: number;
  name: string;
  code?: string | null;
  tin_number?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  contact_person?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  status: "active" | "inactive";
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const INITIAL_DUBAI_DEVELOPERS = [
  { name: "Acube Developments", code: "DEV-ACUBE" },
  { name: "Albatha Real Estate", code: "DEV-ALBATHA" },
  { name: "Aldar Development", code: "DEV-ALDAR" },
  { name: "AQUA Developments", code: "DEV-AQUA" },
  { name: "Azizi Developments", code: "DEV-AZIZI" },
  { name: "BARCO Developers", code: "DEV-BARCO" },
  { name: "Binghatti Developers", code: "DEV-BINGHATTI" },
  { name: "BNW Developments", code: "DEV-BNW" },
  { name: "Casagrand Premier Builders Ltd", code: "DEV-CASAGRAND" },
  { name: "Danube Properties", code: "DEV-DANUBE" },
  { name: "DAR Global", code: "DEV-DARGLOBAL" },
  { name: "Deca Properties", code: "DEV-DECA" },
  { name: "Deniz Properties", code: "DEV-DENIZ" },
  { name: "DUGASTA", code: "DEV-DUGASTA" },
  { name: "Ellington Properties", code: "DEV-ELLINGTON" },
  { name: "Enso Development", code: "DEV-ENSO" },
  { name: "Expo City Dubai", code: "DEV-EXPOCITY" },
  { name: "GFS Developments", code: "DEV-GFS" },
  { name: "H&H Development", code: "DEV-HH" },
  { name: "Imtiaz Development", code: "DEV-IMTIAZ" },
  { name: "Leos Development", code: "DEV-LEOS" },
  { name: "One Yard Development", code: "DEV-ONEYARD" },
  { name: "Peace Homes Development", code: "DEV-PEACEHOMES" },
  { name: "Qube Development", code: "DEV-QUBE" },
  { name: "Reportage Properties", code: "DEV-REPORTAGE" },
  { name: "Rove Residences Developers", code: "DEV-ROVE" },
  { name: "Samana Developers", code: "DEV-SAMANA" },
  { name: "Sobha Realty", code: "DEV-SOBHA" },
  { name: "Tarrad Development", code: "DEV-TARRAD" },
  { name: "Tiger Properties", code: "DEV-TIGER" },
];

export async function ensureDevelopersTable() {
  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS developers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      code VARCHAR(50) NULL,
      tin_number VARCHAR(100) NULL,
      address TEXT NULL,
      city VARCHAR(100) DEFAULT 'Dubai',
      country VARCHAR(100) DEFAULT 'United Arab Emirates',
      contact_person VARCHAR(150) NULL,
      contact_email VARCHAR(150) NULL,
      contact_phone VARCHAR(50) NULL,
      status VARCHAR(50) DEFAULT 'active',
      deleted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_code (code),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  try {
    await commissionsDb.query("ALTER TABLE developers DROP COLUMN rating");
  } catch (e) {}
  try {
    await commissionsDb.query("ALTER TABLE developers DROP COLUMN description");
  } catch (e) {}

  // Seed default developers if table is empty
  const [rows] = await commissionsDb.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM developers");
  if (rows[0]?.count === 0) {
    for (const dev of INITIAL_DUBAI_DEVELOPERS) {
      await commissionsDb.query(
        `INSERT INTO developers (name, code, tin_number, address, city, country, status) 
         VALUES (?, ?, '100392817400003', 'Business Bay, Downtown', 'Dubai', 'United Arab Emirates', 'active')`,
        [dev.name, dev.code]
      );
    }
  }
}

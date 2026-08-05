import { commissionsDb } from "@/lib/db";
import { ensureDevelopersTable } from "@/lib/developers";
import { RowDataPacket } from "mysql2";

export interface ProjectRecord {
  id: number;
  developer_id: number;
  developer_name: string;
  project_name: string;
  project_code?: string | null;
  project_location: string;
  project_type?: string | null;
  completion_status?: string | null;
  status: "active" | "inactive";
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const INITIAL_REAL_PROJECTS = [
  // Acube Developments
  { developer: "Acube Developments", name: "Electra by Acube", code: "PRJ-ACUBE-ELECTRA", location: "Jumeirah Village Circle (JVC), Dubai", type: "Luxury Residential", completion: "Off-Plan" },
  { developer: "Acube Developments", name: "Adihara Heights", code: "PRJ-ACUBE-ADIHARA", location: "Arjan, Dubai", type: "Boutique Residential", completion: "Off-Plan" },
  { developer: "Acube Developments", name: "Onix Tower", code: "PRJ-ACUBE-ONIX", location: "Business Bay, Dubai", type: "Commercial Tower", completion: "Under Construction" },

  // Albatha Real Estate
  { developer: "Albatha Real Estate", name: "Albatha Residence", code: "PRJ-ALBATHA-RES", location: "Al Nahda, Dubai", type: "Residential", completion: "Ready / Handed Over" },
  { developer: "Albatha Real Estate", name: "Albatha Logistics Park", code: "PRJ-ALBATHA-LOGISTICS", location: "Dubai Industrial City, Dubai", type: "Commercial", completion: "Ready / Handed Over" },

  // Aldar Development
  { developer: "Aldar Development", name: "Nikki Beach Residences", code: "PRJ-ALDAR-NIKKIBEACH", location: "Ras Al Khaimah, UAE", type: "Luxury Beachfront", completion: "Off-Plan" },
  { developer: "Aldar Development", name: "Haven by Aldar", code: "PRJ-ALDAR-HAVEN", location: "Dubailand, Dubai", type: "Wellness Master Community", completion: "Off-Plan" },
  { developer: "Aldar Development", name: "Gardenia Bay", code: "PRJ-ALDAR-GARDENIABAY", location: "Yas Island, Abu Dhabi", type: "Waterfront Community", completion: "Off-Plan" },
  { developer: "Aldar Development", name: "Sama Yas", code: "PRJ-ALDAR-SAMAYAS", location: "Yas Park, Abu Dhabi", type: "Luxury Parkside", completion: "Off-Plan" },

  // AQUA Developments
  { developer: "AQUA Developments", name: "The Community by AQUA", code: "PRJ-AQUA-COMMUNITY", location: "Motor City, Dubai", type: "Co-Living Residential", completion: "Under Construction" },
  { developer: "AQUA Developments", name: "OIA Residence", code: "PRJ-AQUA-OIA", location: "Motor City, Dubai", type: "Greek Inspired Community", completion: "Ready / Handed Over" },

  // Azizi Developments
  { developer: "Azizi Developments", name: "Azizi Venice", code: "PRJ-AZIZI-VENICE", location: "Dubai South, Dubai", type: "Lagoon Community", completion: "Off-Plan" },
  { developer: "Azizi Developments", name: "Azizi Riviera", code: "PRJ-AZIZI-RIVIERA", location: "Meydan, MBR City, Dubai", type: "Waterfront Residential", completion: "Under Construction" },
  { developer: "Azizi Developments", name: "Azizi Creek Views", code: "PRJ-AZIZI-CREEKVIEWS", location: "Dubai Healthcare City, Dubai", type: "Residential", completion: "Ready / Handed Over" },
  { developer: "Azizi Developments", name: "Azizi Mina", code: "PRJ-AZIZI-MINA", location: "Palm Jumeirah, Dubai", type: "Luxury Serviced Apartments", completion: "Ready / Handed Over" },
  { developer: "Azizi Developments", name: "Azizi Amber", code: "PRJ-AZIZI-AMBER", location: "Al Furjan, Dubai", type: "Residential", completion: "Under Construction" },

  // BARCO Developers
  { developer: "BARCO Developers", name: "Barco Heights", code: "PRJ-BARCO-HEIGHTS", location: "Jumeirah Village Circle (JVC), Dubai", type: "Residential", completion: "Off-Plan" },
  { developer: "BARCO Developers", name: "Barco Avenue", code: "PRJ-BARCO-AVENUE", location: "Al Furjan, Dubai", type: "Mixed Use", completion: "Off-Plan" },

  // Binghatti Developers
  { developer: "Binghatti Developers", name: "Bugatti Residences by Binghatti", code: "PRJ-BINGHATTI-BUGATTI", location: "Business Bay, Dubai", type: "Hyper-Luxury Residences", completion: "Under Construction" },
  { developer: "Binghatti Developers", name: "Mercedes-Benz Places by Binghatti", code: "PRJ-BINGHATTI-BENZ", location: "Downtown Dubai, Dubai", type: "Ultra-Luxury Skyscraper", completion: "Off-Plan" },
  { developer: "Binghatti Developers", name: "Binghatti Trillionaire Residences", code: "PRJ-BINGHATTI-TRILLIONAIRE", location: "Business Bay Canal, Dubai", type: "Luxury Residential", completion: "Off-Plan" },
  { developer: "Binghatti Developers", name: "Binghatti Hills", code: "PRJ-BINGHATTI-HILLS", location: "Dubai Science Park, Dubai", type: "Residential Resort", completion: "Off-Plan" },
  { developer: "Binghatti Developers", name: "Binghatti Phantom", code: "PRJ-BINGHATTI-PHANTOM", location: "Jumeirah Village Circle (JVC), Dubai", type: "High-Rise Residential", completion: "Off-Plan" },

  // BNW Developments
  { developer: "BNW Developments", name: "BNW Aqua", code: "PRJ-BNW-AQUA", location: "Dubai Science Park, Dubai", type: "Water-Feature Residences", completion: "Off-Plan" },
  { developer: "BNW Developments", name: "BNW Reserve", code: "PRJ-BNW-RESERVE", location: "Meydan, Dubai", type: "Boutique Apartments", completion: "Off-Plan" },

  // Casagrand Premier Builders Ltd
  { developer: "Casagrand Premier Builders Ltd", name: "Casagrand Flagship Dubai", code: "PRJ-CASAGRAND-FLAGSHIP", location: "Dubailand, Dubai", type: "Master Community", completion: "Off-Plan" },
  { developer: "Casagrand Premier Builders Ltd", name: "Casagrand Heights", code: "PRJ-CASAGRAND-HEIGHTS", location: "Jumeirah Village Circle (JVC), Dubai", type: "Residential", completion: "Off-Plan" },

  // Danube Properties
  { developer: "Danube Properties", name: "Danube Oceanz", code: "PRJ-DANUBE-OCEANZ", location: "Dubai Maritime City, Dubai", type: "Waterfront Residences", completion: "Off-Plan" },
  { developer: "Danube Properties", name: "Danube Sportz", code: "PRJ-DANUBE-SPORTZ", location: "Dubai Sports City, Dubai", type: "Sports-Themed Residential", completion: "Off-Plan" },
  { developer: "Danube Properties", name: "Danube Bayz 101", code: "PRJ-DANUBE-BAYZ101", location: "Business Bay, Dubai", type: "Luxury Skyscraper", completion: "Off-Plan" },
  { developer: "Danube Properties", name: "Danube Eleganz", code: "PRJ-DANUBE-ELEGANZ", location: "Jumeirah Village Circle (JVC), Dubai", type: "Residential", completion: "Under Construction" },
  { developer: "Danube Properties", name: "Danube Fashionz", code: "PRJ-DANUBE-FASHIONZ", location: "Jumeirah Village Triangle (JVT), Dubai", type: "Fashion-Branded Residences", completion: "Under Construction" },

  // DAR Global
  { developer: "DAR Global", name: "DaVinci Tower by Pagani", code: "PRJ-DAR-DAVINCI", location: "Business Bay, Dubai", type: "Pagani Designed Residences", completion: "Under Construction" },
  { developer: "DAR Global", name: "W Residences Dubai - Downtown", code: "PRJ-DAR-WRESIDENCES", location: "Downtown Dubai, Dubai", type: "Branded Luxury Residences", completion: "Under Construction" },
  { developer: "DAR Global", name: "The Trump Tower Dubai", code: "PRJ-DAR-TRUMP", location: "Sheikh Zayed Road, Dubai", type: "Ultra-Luxury Skyscraper", completion: "Off-Plan" },

  // Deca Properties
  { developer: "Deca Properties", name: "Trinity by Deca", code: "PRJ-DECA-TRINITY", location: "Arjan, Dubai", type: "Luxury Private Pool Units", completion: "Off-Plan" },
  { developer: "Deca Properties", name: "Olive Residences", code: "PRJ-DECA-OLIVE", location: "Jumeirah Village Circle (JVC), Dubai", type: "Modern Apartments", completion: "Off-Plan" },

  // Deniz Properties
  { developer: "Deniz Properties", name: "Deniz Royal Tower", code: "PRJ-DENIZ-ROYAL", location: "Business Bay, Dubai", type: "Luxury High-Rise", completion: "Off-Plan" },
  { developer: "Deniz Properties", name: "Deniz Horizon", code: "PRJ-DENIZ-HORIZON", location: "Dubai Marina, Dubai", type: "Waterfront Units", completion: "Under Construction" },

  // DUGASTA
  { developer: "DUGASTA", name: "Al Oasis by Dugasta", code: "PRJ-DUGASTA-ALOASIS", location: "International City, Dubai", type: "Affordable Luxury", completion: "Under Construction" },
  { developer: "DUGASTA", name: "Dugasta Heights", code: "PRJ-DUGASTA-HEIGHTS", location: "Dubai South, Dubai", type: "Residential", completion: "Off-Plan" },

  // Ellington Properties
  { developer: "Ellington Properties", name: "Ellington Beach House", code: "PRJ-ELLINGTON-BEACHHOUSE", location: "Palm Jumeirah, Dubai", type: "Boutique Beachfront", completion: "Under Construction" },
  { developer: "Ellington Properties", name: "Upper House by Ellington", code: "PRJ-ELLINGTON-UPPERHOUSE", location: "Jumeirah Lake Towers (JLT), Dubai", type: "Residential", completion: "Under Construction" },
  { developer: "Ellington Properties", name: "Mercer House", code: "PRJ-ELLINGTON-MERCERHOUSE", location: "Uptown Dubai, JLT", type: "Luxury Twin Towers", completion: "Off-Plan" },
  { developer: "Ellington Properties", name: "Ocean House", code: "PRJ-ELLINGTON-OCEANHOUSE", location: "Palm Jumeirah, Dubai", type: "Ultra-Luxury Oceanfront", completion: "Under Construction" },

  // Enso Development
  { developer: "Enso Development", name: "Enso Jade", code: "PRJ-ENSO-JADE", location: "Jumeirah Village Circle (JVC), Dubai", type: "Zen-Inspired Living", completion: "Off-Plan" },
  { developer: "Enso Development", name: "Enso Opal", code: "PRJ-ENSO-OPAL", location: "Arjan, Dubai", type: "Boutique Residences", completion: "Off-Plan" },

  // Expo City Dubai
  { developer: "Expo City Dubai", name: "Mangrove Residences", code: "PRJ-EXPOCITY-MANGROVE", location: "Expo City, Dubai", type: "Eco-Friendly Master Plan", completion: "Off-Plan" },
  { developer: "Expo City Dubai", name: "Sky Residences", code: "PRJ-EXPOCITY-SKY", location: "Expo City, Dubai", type: "Sustainable Apartments", completion: "Off-Plan" },
  { developer: "Expo City Dubai", name: "Expo Valley Villas", code: "PRJ-EXPOCITY-VALLEY", location: "Expo City, Dubai", type: "Luxury Eco Villas", completion: "Off-Plan" },

  // GFS Developments
  { developer: "GFS Developments", name: "GFS Boulevard", code: "PRJ-GFS-BOULEVARD", location: "Majan, Dubailand, Dubai", type: "Mixed Use", completion: "Under Construction" },
  { developer: "GFS Developments", name: "GFS Heights", code: "PRJ-GFS-HEIGHTS", location: "Arjan, Dubai", type: "Residential", completion: "Off-Plan" },

  // H&H Development
  { developer: "H&H Development", name: "Eden House The Canal", code: "PRJ-HH-EDENHOUSE", location: "Dubai Water Canal, Dubai", type: "Ultra-Luxury Boutique", completion: "Under Construction" },
  { developer: "H&H Development", name: "Eden House Dubai Hills", code: "PRJ-HH-EDENHILLS", location: "Dubai Hills Estate, Dubai", type: "Parkside Villas", completion: "Off-Plan" },

  // Imtiaz Development
  { developer: "Imtiaz Development", name: "Beach Walk by Imtiaz", code: "PRJ-IMTIAZ-BEACHWALK", location: "Dubai Islands, Dubai", type: "Waterfront Resort", completion: "Off-Plan" },
  { developer: "Imtiaz Development", name: "Cove by Imtiaz", code: "PRJ-IMTIAZ-COVE", location: "Dubailand, Dubai", type: "Boutique Residential", completion: "Off-Plan" },
  { developer: "Imtiaz Development", name: "Westwood by Imtiaz", code: "PRJ-IMTIAZ-WESTWOOD", location: "Al Furjan, Dubai", type: "Serviced Apartments", completion: "Ready / Handed Over" },

  // Leos Development
  { developer: "Leos Development", name: "Weybridge Gardens", code: "PRJ-LEOS-WEYBRIDGE", location: "Dubailand, Dubai", type: "British Design Residences", completion: "Under Construction" },
  { developer: "Leos Development", name: "Hadley Heights by LEOS", code: "PRJ-LEOS-HADLEY", location: "Jumeirah Village Circle (JVC), Dubai", type: "Modern High-Rise", completion: "Under Construction" },

  // One Yard Development
  { developer: "One Yard Development", name: "One Yard Residences", code: "PRJ-ONEYARD-RESIDENCES", location: "Meydan, Dubai", type: "Boutique Apartments", completion: "Off-Plan" },

  // Peace Homes Development
  { developer: "Peace Homes Development", name: "Peace Lagoon", code: "PRJ-PEACE-LAGOON", location: "Dubailand Residence Complex, Dubai", type: "Resort Style Pool Units", completion: "Off-Plan" },
  { developer: "Peace Homes Development", name: "Peace Skycases", code: "PRJ-PEACE-SKYCASES", location: "Jumeirah Village Circle (JVC), Dubai", type: "Sky Duplexes", completion: "Off-Plan" },

  // Qube Development
  { developer: "Qube Development", name: "Aranya by Qube", code: "PRJ-QUBE-ARANYA", location: "Majan, Dubailand, Dubai", type: "Nature-Inspired Living", completion: "Off-Plan" },
  { developer: "Qube Development", name: "Qube Residences", code: "PRJ-QUBE-RESIDENCES", location: "Motor City, Dubai", type: "Contemporary Units", completion: "Off-Plan" },

  // Reportage Properties
  { developer: "Reportage Properties", name: "Reportage Village", code: "PRJ-REPORTAGE-VILLAGE", location: "Dubailand, Dubai", type: "Townhouse Community", completion: "Off-Plan" },
  { developer: "Reportage Properties", name: "Rukan Tower", code: "PRJ-REPORTAGE-RUKAN", location: "Wadi Al Safa, Dubailand, Dubai", type: "Residential", completion: "Ready / Handed Over" },

  // Rove Residences Developers
  { developer: "Rove Residences Developers", name: "Rove Home Downtown", code: "PRJ-ROVE-DOWNTOWN", location: "Downtown Dubai, Dubai", type: "Branded Hospitality Residences", completion: "Off-Plan" },
  { developer: "Rove Residences Developers", name: "Rove Home Marasi Drive", code: "PRJ-ROVE-MARASI", location: "Business Bay, Dubai", type: "Waterfront Branded Units", completion: "Off-Plan" },

  // Samana Developers
  { developer: "Samana Developers", name: "Samana Manhattan", code: "PRJ-SAMANA-MANHATTAN", location: "Jumeirah Village Circle (JVC), Dubai", type: "Private Pool Apartments", completion: "Off-Plan" },
  { developer: "Samana Developers", name: "Samana Lake Views", code: "PRJ-SAMANA-LAKEVIEWS", location: "Production City (IMPZ), Dubai", type: "Luxury Private Pool", completion: "Off-Plan" },
  { developer: "Samana Developers", name: "Samana Ivy Gardens", code: "PRJ-SAMANA-IVYGARDENS", location: "Dubai Land Residence Complex, Dubai", type: "Private Pool Community", completion: "Under Construction" },

  // Sobha Realty
  { developer: "Sobha Realty", name: "Sobha Hartland II", code: "PRJ-SOBHA-HARTLAND2", location: "MBR City, Dubai", type: "Master Community", completion: "Off-Plan" },
  { developer: "Sobha Realty", name: "Sobha Reserve", code: "PRJ-SOBHA-RESERVE", location: "Wadi Al Safa 2, Dubai", type: "Villa Community", completion: "Off-Plan" },
  { developer: "Sobha Realty", name: "Sobha Orbis", code: "PRJ-SOBHA-ORBIS", location: "Motor City, Dubai", type: "Residential Towers", completion: "Off-Plan" },
  { developer: "Sobha Realty", name: "Sobha One", code: "PRJ-SOBHA-ONE", location: "Ras Al Khor, Dubai", type: "Residential", completion: "Under Construction" },
  { developer: "Sobha Realty", name: "Sobha SeaHaven", code: "PRJ-SOBHA-SEAHAVEN", location: "Dubai Harbour, Dubai", type: "Luxury Waterfront", completion: "Under Construction" },

  // Tarrad Development
  { developer: "Tarrad Development", name: "Tarrad Oasis", code: "PRJ-TARRAD-OASIS", location: "International City, Dubai", type: "Mixed Use", completion: "Off-Plan" },
  { developer: "Tarrad Development", name: "Tarrad Heights", code: "PRJ-TARRAD-HEIGHTS", location: "Jumeirah Village Circle (JVC), Dubai", type: "Residential", completion: "Off-Plan" },

  // Tiger Properties
  { developer: "Tiger Properties", name: "Tiger Sky Tower", code: "PRJ-TIGER-SKYTOWER", location: "Business Bay, Dubai", type: "Ultra-High Skyscraper", completion: "Off-Plan" },
  { developer: "Tiger Properties", name: "Volga Tower", code: "PRJ-TIGER-VOLGA", location: "Jumeirah Village Triangle (JVT), Dubai", type: "Residential Tower", completion: "Off-Plan" },
  { developer: "Tiger Properties", name: "Seslia Tower", code: "PRJ-TIGER-SESLIA", location: "Jumeirah Village Triangle (JVT), Dubai", type: "High-Rise Residential", completion: "Under Construction" }
];

export async function ensureProjectsTable() {
  await ensureDevelopersTable();

  await commissionsDb.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      developer_id INT NOT NULL,
      developer_name VARCHAR(255) NOT NULL,
      project_name VARCHAR(255) NOT NULL,
      project_code VARCHAR(50) NULL,
      project_location VARCHAR(255) NOT NULL,
      project_type VARCHAR(100) DEFAULT 'Residential',
      completion_status VARCHAR(100) DEFAULT 'Off-Plan',
      status VARCHAR(50) DEFAULT 'active',
      deleted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dev_id (developer_id),
      INDEX idx_dev_name (developer_name),
      INDEX idx_project_name (project_name),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Ensure all initial real projects are seeded into database if missing
  const [devs] = await commissionsDb.query<RowDataPacket[]>("SELECT id, name FROM developers WHERE deleted_at IS NULL");
  const devMap = new Map<string, number>();
  for (const d of devs) {
    devMap.set(d.name.toLowerCase().trim(), d.id);
  }

  const [existingProjects] = await commissionsDb.query<RowDataPacket[]>("SELECT project_name FROM projects");
  const existingSet = new Set(existingProjects.map((p) => p.project_name.toLowerCase().trim()));

  for (const p of INITIAL_REAL_PROJECTS) {
    if (!existingSet.has(p.name.toLowerCase().trim())) {
      const devId = devMap.get(p.developer.toLowerCase().trim()) || devs[0]?.id || 1;
      await commissionsDb.query(
        `INSERT INTO projects (developer_id, developer_name, project_name, project_code, project_location, project_type, completion_status, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
        [devId, p.developer, p.name, p.code, p.location, p.type, p.completion]
      );
      existingSet.add(p.name.toLowerCase().trim());
    }
  }
}

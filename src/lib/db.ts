import mysql from "mysql2/promise";

// 1. Connection Pool for Main App Database (commissions_hub)
export const commissionsDb = mysql.createPool({
  host: process.env.DB_COMMISSIONS_HOST || process.env.DB_HOST,
  user: process.env.DB_COMMISSIONS_USERNAME || process.env.DB_USERNAME,
  password: process.env.DB_COMMISSIONS_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.DB_COMMISSIONS_DATABASE || "commissions_hub",
  port: Number(process.env.DB_COMMISSIONS_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
  queueLimit: 0,
});

// 2. Connection Pool for Reference / Users Database (leuteriorealty)
export const leuterioDb = mysql.createPool({
  host: process.env.DB_LEUTERIO_HOST || process.env.DB_HOST,
  user: process.env.DB_LEUTERIO_USERNAME || process.env.DB_USERNAME,
  password: process.env.DB_LEUTERIO_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.DB_LEUTERIO_DATABASE || "leuteriorealty",
  port: Number(process.env.DB_LEUTERIO_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
  queueLimit: 0,
});

export default commissionsDb;

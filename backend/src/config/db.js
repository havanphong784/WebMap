import pg from "pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

const {Pool, types} = pg;

types.setTypeParser(1114, (val) => val);

/**
 * Database SSL Configuration
 * 
 * Priority:
 * 1. CA certificate from DB_CA_CERT_PATH (file path)
 * 2. CA certificate from DB_CA_CERT (env variable content)
 * 3. Fallback: rejectUnauthorized=false + NODE_TLS_REJECT_UNAUTHORIZED=0
 */

let sslConfig = {};

// Option 1: CA cert from file
if (process.env.DB_CA_CERT_PATH) {
  try {
    const ca = fs.readFileSync(path.resolve(process.env.DB_CA_CERT_PATH), "utf8");
    sslConfig = {rejectUnauthorized: true, ca: [ca]};
    console.log("✅ SSL: Using CA certificate from file");
  } catch (err) {
    console.warn("⚠️ SSL: Failed to read CA cert file:", err.message);
  }
}

// Option 2: CA cert from env variable
if (!sslConfig.ca && process.env.DB_CA_CERT) {
  sslConfig = {rejectUnauthorized: true, ca: [process.env.DB_CA_CERT]};
  console.log("✅ SSL: Using CA certificate from env");
}

// Option 3: Fallback — disable verification (Aiven free tier uses self-signed certs)
if (!sslConfig.ca) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  sslConfig = {rejectUnauthorized: false};
  console.warn("⚠️ SSL: Using rejectUnauthorized=false (no CA cert provided)");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("PostgreSQL Pool error:", err.message);
});

pool.connect()
  .then(client => {
    console.log("✅ Database: Connected");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database: Connection failed!", err.message);
  });

export default pool;

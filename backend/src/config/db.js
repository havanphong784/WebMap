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
 * 1. Use CA certificate if DB_CA_CERT_PATH is provided (production)
 * 2. Use CA certificate from Aiven if DB_CA_CERT is provided (production)
 * 3. Fallback to workaround for development (NODE_TLS_REJECT_UNAUTHORIZED = "0")
 * 
 * For production:
 * - Download CA certificate from Aiven console
 * - Set DB_CA_CERT_PATH=/path/to/ca.pem or DB_CA_CERT=<cert-content>
 * - Remove NODE_TLS_REJECT_UNAUTHORIZED workaround
 */

let sslConfig = {};
const isDev = process.env.NODE_ENV !== "production";

// Try to use CA certificate from file path
if (process.env.DB_CA_CERT_PATH) {
  try {
    const caPath = path.resolve(process.env.DB_CA_CERT_PATH);
    const ca = fs.readFileSync(caPath, 'utf8');
    sslConfig = {
      rejectUnauthorized: true,
      ca: [ca]
    };
    console.log("✅ Using CA certificate from file:", process.env.DB_CA_CERT_PATH);
  } catch (err) {
    console.warn("⚠️ Failed to read CA certificate file:", err.message);
    console.warn("Falling back to development workaround...");
    // Fall through to workaround
  }
}

// Try to use CA certificate from environment variable
if (!sslConfig.ca && process.env.DB_CA_CERT) {
  try {
    sslConfig = {
      rejectUnauthorized: true,
      ca: [process.env.DB_CA_CERT]
    };
    console.log("✅ Using CA certificate from environment variable");
  } catch (err) {
    console.warn("⚠️ Failed to parse CA certificate from env:", err.message);
  }
}

// Fallback to development workaround if no CA certificate is available
if (!sslConfig.ca) {
  if (isDev) {
    console.warn("⚠️ Using development SSL workaround (NODE_TLS_REJECT_UNAUTHORIZED = 0)");
    console.warn("⚠️ This is NOT secure for production!");
    console.warn("⚠️ For production, set DB_CA_CERT_PATH or DB_CA_CERT environment variable");
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    sslConfig = {
      rejectUnauthorized: false
    };
  } else {
    console.error("❌ Production mode requires CA certificate!");
    console.error("❌ Set DB_CA_CERT_PATH or DB_CA_CERT environment variable");
    process.exit(1);
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Lỗi PostgreSQL Pool bất ngờ:", err.message);
});

// Kiểm tra kết nối khi khởi tạo
pool.connect()
  .then(client => {
    console.log("✅ Database: Kết nối PostgreSQL thành công !");
    client.release();
  })
  .catch(err => {
    console.error("❌ Database: Lỗi kết nối !", err.stack);
  });

export default pool;

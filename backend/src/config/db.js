// PostgreSQL connection pool.
// Every other backend file that needs the database should import { pool }
// from here instead of creating its own `pg` client/pool.

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "WARNING: DATABASE_URL is not set. Add it to backend/.env before using PostgreSQL features."
  );
}

export const pool = new Pool({
  connectionString,
});

pool.on("error", (err) => {
  // Prevents an idle client error from crashing the whole process.
  console.error("Unexpected PostgreSQL pool error:", err);
});

/**
 * Quick connectivity check. Run this once at startup (or via the test
 * script below) to confirm the DATABASE_URL actually works.
 */
export async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT NOW();");
    return result.rows[0];
  } finally {
    client.release();
  }
}

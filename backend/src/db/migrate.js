// Runs schema.sql against the database configured in DATABASE_URL.
// This is just a convenience so you don't have to copy-paste SQL into
// pgAdmin manually — same effect either way.
//
// Run with: npm run db:migrate   (from inside backend/)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  const client = await pool.connect();
  try {
    console.log("Running schema.sql against the database...");
    await client.query(sql);
    console.log("✅ products table created (or recreated).");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

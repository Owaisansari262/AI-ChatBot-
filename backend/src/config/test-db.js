// Standalone script: confirms DATABASE_URL is correct and PostgreSQL is
// reachable, without starting the whole Express server.
//
// Run with: npm run db:test   (from inside backend/)

import { testConnection, pool } from "./db.js";

(async () => {
  try {
    const row = await testConnection();
    console.log("✅ PostgreSQL connected successfully.");
    console.log("   SELECT NOW() ->", row.now);
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:");
    console.error("  ", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

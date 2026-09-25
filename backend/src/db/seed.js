// One-time migration script: reads the existing dummy data from
// backend/data/products.js and inserts it into the PostgreSQL `products`
// table created by schema.sql.
//
// product.js is NOT deleted or modified by this script — it stays as a
// backup/reference until the PostgreSQL version is fully verified
// (per project rule: don't delete working files until confirmed).
//
// Run with: npm run db:seed   (from inside backend/)

import { pool } from "../config/db.js";
import { products } from "../../data/products.js";

async function seed() {
  const client = await pool.connect();
  try {
    console.log(`Seeding ${products.length} products into PostgreSQL...`);

    for (const p of products) {
      await client.query(
        `INSERT INTO products
           (slug, name, brand, category, price, currency, stock, availability,
            description, features, specifications, use_case)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           brand = EXCLUDED.brand,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           currency = EXCLUDED.currency,
           stock = EXCLUDED.stock,
           availability = EXCLUDED.availability,
           description = EXCLUDED.description,
           features = EXCLUDED.features,
           specifications = EXCLUDED.specifications,
           use_case = EXCLUDED.use_case,
           updated_at = NOW();`,
        [
          p.id,
          p.name,
          p.brand,
          p.category,
          p.price,
          p.currency,
          p.stock,
          p.availability,
          p.description,
          JSON.stringify(p.features || []),
          JSON.stringify(p.specifications || {}),
          p.useCase,
        ]
      );
      console.log(`  ✅ ${p.name}`);
    }

    const { rows } = await client.query("SELECT COUNT(*) FROM products;");
    console.log(`\nDone. products table now has ${rows[0].count} rows.`);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

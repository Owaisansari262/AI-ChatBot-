// Stage 5 (Option B): generates a Gemini embedding for every product
// currently in PostgreSQL and stores it in the `embedding` JSONB column.
//
// Safe to re-run any time (e.g. after adding/editing a product) — it
// simply overwrites the embedding for every row.
//
// Run with: npm run db:embed   (from inside backend/)

import { pool } from "../config/db.js";
import { productRowToDocument } from "./productDocument.js";
import { embedText } from "../../rag/embeddings.js";

async function embedAllProducts() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT * FROM products ORDER BY id;");
    console.log(`Found ${rows.length} products. Generating embeddings...`);

    for (const row of rows) {
      const document = productRowToDocument(row);
      const embedding = await embedText(document, "RETRIEVAL_DOCUMENT");

      await client.query("UPDATE products SET embedding = $1, updated_at = NOW() WHERE id = $2;", [
        JSON.stringify(embedding),
        row.id,
      ]);

      console.log(`  ✅ ${row.name} (${embedding.length} dimensions)`);
    }

    console.log("\nDone. Every product now has an embedding stored in PostgreSQL.");
  } catch (err) {
    console.error("❌ Embedding generation failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

embedAllProducts();
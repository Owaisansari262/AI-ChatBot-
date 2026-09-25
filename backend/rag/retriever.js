// RAG retriever — Option B (no pgvector).
//
// Products and their pre-computed embeddings now live in PostgreSQL
// (see src/db/schema.sql, src/db/embed.js) instead of data/products.js.
// buildIndex() loads them all into memory once at startup; retrieve()
// still does the actual similarity math in Node.js, exactly like before —
// only the SOURCE of the data changed, not the matching logic.

import { pool } from "../src/config/db.js";
import { productRowToDocument } from "../src/db/productDocument.js";
import { embedText, cosineSimilarity } from "./embeddings.js";

// Below this similarity score (and with no keyword/price signal), we treat
// the query as "not covered by our data" rather than force a weak match.
const MIN_SIMILARITY = 0.35;
const DEFAULT_TOP_K = 5;
const TOP_K = Number(process.env.TOP_K) || DEFAULT_TOP_K;

// In-memory cache: [{ product, document, embedding }]
// `product` here is the raw PostgreSQL row (id, slug, name, brand, ...).
let index = null;
let buildingPromise = null;

/**
 * Loads every product + its stored embedding from PostgreSQL into memory.
 * Safe to call multiple times — only builds once per server run.
 * Call again (after clearing `index`) if products change without a restart.
 */
export async function buildIndex() {
  if (index) return index;
  if (buildingPromise) return buildingPromise;

  buildingPromise = (async () => {
    const { rows } = await pool.query("SELECT * FROM products;");

    const missingEmbeddings = rows.filter((r) => !r.embedding);
    if (missingEmbeddings.length > 0) {
      console.warn(
        `WARNING: ${missingEmbeddings.length} product(s) have no embedding yet. Run "npm run db:embed".`
      );
    }

    const built = rows
      .filter((r) => Array.isArray(r.embedding))
      .map((product) => ({
        product,
        document: productRowToDocument(product),
        embedding: product.embedding, // pg parses JSONB into a plain JS array already
      }));

    index = built;
    console.log(`RAG index built: ${index.length} product documents loaded from PostgreSQL.`);
    return index;
  })();

  return buildingPromise;
}

/**
 * Very small heuristic price-ceiling parser for queries like:
 * "TP-Link ka router batao jo 30,000 PKR se kam ho" or
 * "router under 30000 PKR". Returns a number or null.
 */
function extractPriceCeiling(query) {
  const hasCeilingWord = /\b(under|below|less than|se\s*kam|ke\s*andar|tak)\b/i.test(query);
  if (!hasCeilingWord) return null;

  const numberMatch = query.match(/(\d[\d,]{2,})/);
  if (!numberMatch) return null;

  const value = parseInt(numberMatch[1].replace(/,/g, ""), 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * Small keyword bonus so exact brand/category/product-name mentions in the
 * query outrank purely semantic near-misses. This is on top of, not instead
 * of, the embedding similarity score.
 */
function keywordBonus(query, product) {
  const q = query.toLowerCase();
  let bonus = 0;
  if (q.includes(product.brand.toLowerCase())) bonus += 0.08;
  if (q.includes(product.category.toLowerCase())) bonus += 0.05;
  if (q.includes(product.name.toLowerCase())) bonus += 0.12;
  return bonus;
}

/**
 * Retrieve the most relevant product documents for a user query.
 *
 * Returns:
 *   {
 *     matches: [{ product, document, similarity }],
 *     priceCeiling: number | null
 *   }
 */
export async function retrieve(query, topK = TOP_K) {
  await buildIndex();

  const priceCeiling = extractPriceCeiling(query);
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");

  let scored = index.map((entry) => {
    const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
    const bonus = keywordBonus(query, entry.product);
    return { ...entry, similarity, score: similarity + bonus };
  });

  if (priceCeiling !== null) {
    scored = scored.filter((entry) => Number(entry.product.price) <= priceCeiling);
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  // Keep a match if it's semantically similar enough, OR if it survived a
  // price-ceiling filter, OR if it got a keyword bonus (explicit mention).
  const relevant = top.filter(
    (entry) => entry.similarity >= MIN_SIMILARITY || priceCeiling !== null || entry.score > entry.similarity
  );

  return {
    matches: relevant.map(({ product, document, similarity }) => ({ product, document, similarity })),
    priceCeiling,
  };
}
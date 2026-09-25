// Thin wrapper around Gemini's embedContent endpoint, used by the RAG
// retriever to turn text (product documents and user queries) into vectors.
//
// NOTE: this file loads dotenv itself (rather than relying on server.js to
// have run dotenv.config() first). ES module static imports are resolved
// and executed before any top-level code in the importing file runs, so if
// this module read process.env at load time without its own dotenv.config(),
// it could run before server.js's dotenv.config() populated process.env.

import dotenv from "dotenv";
dotenv.config();

function embeddingUrl() {
  const model = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
  const apiKey = process.env.GEMINI_API_KEY;
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
}

const EMBEDDING_DIMENSION = 768;

/**
 * Embed a single piece of text using the Gemini embedding model.
 * taskType should be "RETRIEVAL_DOCUMENT" for product text (Stage 5) or
 * "RETRIEVAL_QUERY" for user questions (Stage 6) — Gemini's docs recommend
 * this distinction for better retrieval quality.
 * Returns a plain array of numbers (the embedding vector).
 */
export async function embedText(text, taskType = "RETRIEVAL_DOCUMENT") {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.EMBEDDING_MODEL || "gemini-embedding-001";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to backend/.env before using RAG.");
  }

  const res = await fetch(embeddingUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIMENSION,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini embedding request failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const values = data?.embedding?.values;

  if (!Array.isArray(values)) {
    throw new Error("Gemini embedding response did not contain a vector.");
  }

  return values;
}

/**
 * Cosine similarity between two equal-length embedding vectors.
 * Returns a value roughly in [-1, 1]; higher means more similar.
 */
export function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
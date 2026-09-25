// Turns a `products` table row (from PostgreSQL) into the same kind of
// flat text document that used to be built from data/products.js.
// Used by both src/db/embed.js (Stage 5) and rag/retriever.js (Stage 6),
// so the text a product was embedded with always matches the text the
// retriever shows to Gemini as context.

export function productRowToDocument(row) {
  const features = Array.isArray(row.features) ? row.features : [];
  const specs = row.specifications && typeof row.specifications === "object" ? row.specifications : {};

  const specsText = Object.entries(specs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  return [
    `Product: ${row.name}`,
    `Brand: ${row.brand}`,
    `Category: ${row.category}`,
    `Price: ${row.currency} ${Number(row.price).toLocaleString()}`,
    `Stock: ${row.stock}`,
    `Availability: ${row.availability}`,
    `Description: ${row.description || ""}`,
    `Features: ${features.join(", ")}`,
    `Specifications: ${specsText}`,
    `Use case: ${row.use_case || ""}`,
  ].join("\n");
}
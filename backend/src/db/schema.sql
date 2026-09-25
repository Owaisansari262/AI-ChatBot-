-- Products table schema, designed around the ACTUAL fields found in
-- backend/data/products.js (not a generic guess):
--   id, name, brand, category, price, currency, stock, availability,
--   description, features (array), specifications (object), useCase
--
-- NOTE: This does NOT yet include the `embedding` column — that is added
-- in Stage 4 (pgvector), after we confirm the correct vector dimension.
--
-- If you already ran a different/incomplete CREATE TABLE products in
-- pgAdmin (the 5-column version), this script safely drops it first.

DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id             SERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,      -- original string id, e.g. "ubnt-unifi-express"
  name           TEXT NOT NULL,
  brand          TEXT NOT NULL,
  category       TEXT NOT NULL,
  price          NUMERIC NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'PKR',
  stock          INTEGER NOT NULL DEFAULT 0,
  availability   TEXT NOT NULL,
  description    TEXT,
  features       JSONB,                     -- array of strings, e.g. ["Wi-Fi 6", "PoE powered"]
  specifications JSONB,                      -- object, e.g. {"Wi-Fi": "Wi-Fi 6", "Ethernet": "Gigabit"}
  use_case       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes for the structured-query side of Stage 7 (hybrid search).
CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_products_category ON products (category);
CREATE INDEX idx_products_price ON products (price);

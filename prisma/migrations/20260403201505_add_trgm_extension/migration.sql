-- 1. Activate extension trgm
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Activate the extension to ignore accents
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 3. Create an index GIN to make the search instant
CREATE INDEX IF NOT EXISTS customer_name_trgm_idx 
ON "customers" USING gin (name gin_trgm_ops);
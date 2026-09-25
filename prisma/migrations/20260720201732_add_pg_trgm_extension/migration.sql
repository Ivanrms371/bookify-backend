CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "customers_name_trgm_idx"
ON "customers"
USING gin ("name" gin_trgm_ops);

CREATE INDEX "customers_email_trgm_idx"
ON "customers"
USING gin ("email" gin_trgm_ops);

CREATE INDEX "customers_phone_trgm_idx"
ON "customers"
USING gin ("phoneNumber" gin_trgm_ops);
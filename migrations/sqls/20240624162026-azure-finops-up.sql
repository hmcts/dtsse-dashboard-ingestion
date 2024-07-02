
CREATE SCHEMA IF NOT EXISTS azure;

CREATE TABLE IF NOT EXISTS azure.finops (
  id SERIAL PRIMARY KEY,
  subscription_id TEXT,
  subscription_name TEXT,
  resource_group TEXT,
  resource_name TEXT,
  date DATE,
  product_name TEXT,
  cost_in_billing_currency FLOAT,
  meter_category TEXT,
  meter_sub_category TEXT,
  meter_name TEXT,
  consumed_service TEXT,
  tags TEXT,
  built_from TEXT DEFAULT NULL
);

CREATE INDEX idx_date ON azure.finops(date);
CREATE INDEX idx_resource_group ON azure.finops(resource_group);
CREATE INDEX idx_resource_name ON azure.finops(resource_name);
CREATE INDEX idx_built_from ON azure.finops(built_from);

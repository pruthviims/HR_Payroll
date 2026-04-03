-- Supabase Schema for HR Payroll Portal (JSON-centric)

-- 0. Cleanup
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS field_configs CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;

-- 1. Create the Unified Payroll Records Table
CREATE TABLE payroll_records (
  id TEXT PRIMARY KEY, -- Format: {tenant_id}_{record_type} or global_{record_type}
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone to read/write records for this custom setup
CREATE POLICY "Anyone can read payroll records" ON payroll_records
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage payroll records" ON payroll_records
  FOR ALL USING (true) WITH CHECK (true);

-- (Repeat similar admin policies for other tables as needed)

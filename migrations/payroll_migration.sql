-- PAYROLL & SETTINGS MIGRATION

-- 1. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initial Seed (Default Hourly Wage, e.g., 17002 / 225 = ~75 TL, let's put 100 as placeholder)
INSERT INTO system_settings (key, value) VALUES ('hourly_wage', '100') ON CONFLICT DO NOTHING;

-- RLS (Open access for simplicity as per rules)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_settings_access" ON system_settings;
CREATE POLICY "public_settings_access" ON system_settings FOR ALL USING (true) WITH CHECK (true);

-- 2. User Daily Details RPC
-- Fetches daily breakdown for a specific user in a specific month
CREATE OR REPLACE FUNCTION get_user_daily_details(target_user_id UUID, target_date DATE)
RETURNS TABLE (
    work_date DATE,
    first_check_in TEXT,
    last_check_out TEXT,
    daily_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(timestamp) as work_date,
        -- Get the earliest check_in time formatted
        TO_CHAR(MIN(timestamp) FILTER (WHERE type = 'check_in'), 'HH24:MI') as first_check_in,
        -- Get the latest check_out time formatted
        TO_CHAR(MAX(timestamp) FILTER (WHERE type = 'check_out'), 'HH24:MI') as last_check_out,
        -- Calculate simple daily hours (Last Out - First In)
        -- Note: This is a simplified calculation suitable for single shift.
        -- Use COALESCE to avoid nulls if check out missing
        ROUND(EXTRACT(EPOCH FROM (
            MAX(timestamp) FILTER (WHERE type = 'check_out') - 
            MIN(timestamp) FILTER (WHERE type = 'check_in')
        )) / 3600, 1) as daily_hours
    FROM attendance
    WHERE user_id = target_user_id
      AND EXTRACT(MONTH FROM timestamp) = EXTRACT(MONTH FROM target_date)
      AND EXTRACT(YEAR FROM timestamp) = EXTRACT(YEAR FROM target_date)
    GROUP BY DATE(timestamp)
    ORDER BY DATE(timestamp) DESC;
END;
$$;

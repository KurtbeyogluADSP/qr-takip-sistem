-- FINAL_MIGRATION.sql
-- Kurtbeyoğlu ADSP - QR Takip Sistemi
-- SON DURUM - 16 Ocak 2026

-- =====================================================
-- 1. USERS TABLOSU (auth.users FK YOK - basit sistem)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'assistant', 'physician', 'staff')),
    is_locked_out BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (basit, public erişim - klinik içi kullanım)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_users_access" ON users;
CREATE POLICY "public_users_access" ON users FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 2. ATTENDANCE (giriş/çıkış kayıtları)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
    timestamp TIMESTAMPTZ DEFAULT now(),
    device_id TEXT,
    qr_token TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_attendance_access" ON attendance;
CREATE POLICY "public_attendance_access" ON attendance FOR ALL USING (true) WITH CHECK (true);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_attendance_user_timestamp ON attendance(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_device ON attendance(device_id);

-- =====================================================
-- 3. QR_TOKENS (giriş QR, kiosk QR)
-- =====================================================
CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    assigned_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_qr_tokens_access" ON qr_tokens;
CREATE POLICY "public_qr_tokens_access" ON qr_tokens FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 4. DAILY_STATUS (gün kapatma)
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    is_closed BOOLEAN DEFAULT false,
    closed_by TEXT,
    closed_at TIMESTAMPTZ
);

ALTER TABLE daily_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_daily_status_access" ON daily_status;
CREATE POLICY "public_daily_status_access" ON daily_status FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. RPC: Aylık Analizler
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_analytics(target_date DATE)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    total_work_days BIGINT,
    avg_entry_time TEXT,
    avg_exit_time TEXT,
    total_hours NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.name AS user_name,
        COUNT(DISTINCT DATE(a.timestamp)) AS total_work_days,
        TO_CHAR(AVG(a.timestamp::time) FILTER (WHERE a.type = 'check_in'), 'HH24:MI') AS avg_entry_time,
        TO_CHAR(AVG(a.timestamp::time) FILTER (WHERE a.type = 'check_out'), 'HH24:MI') AS avg_exit_time,
        ROUND(EXTRACT(EPOCH FROM SUM(
            CASE WHEN a.type = 'check_out' THEN 
                (a.timestamp - LAG(a.timestamp) OVER (PARTITION BY a.user_id, DATE(a.timestamp) ORDER BY a.timestamp))
            END
        )) / 3600, 1) AS total_hours
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id
        AND EXTRACT(MONTH FROM a.timestamp) = EXTRACT(MONTH FROM target_date)
        AND EXTRACT(YEAR FROM a.timestamp) = EXTRACT(YEAR FROM target_date)
    WHERE u.role != 'admin'
    GROUP BY u.id, u.name
    ORDER BY u.name;
END;
$$;

-- =====================================================
-- 6. RPC: Giriş Token İşleme
-- =====================================================
CREATE OR REPLACE FUNCTION process_reentry_token(token_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_record RECORD;
BEGIN
    -- Token'ı bul ve kontrol et
    SELECT * INTO v_token_record
    FROM qr_tokens
    WHERE token = token_text
    AND used_at IS NULL
    AND expires_at > now();

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Geçersiz veya süresi dolmuş QR');
    END IF;

    -- Token'ı kullanıldı olarak işaretle
    UPDATE qr_tokens SET used_at = now() WHERE id = v_token_record.id;

    -- Kullanıcının kilidini aç
    UPDATE users SET is_locked_out = false WHERE id = v_token_record.assigned_user_id;

    RETURN json_build_object('success', true, 'user_id', v_token_record.assigned_user_id);
END;
$$;

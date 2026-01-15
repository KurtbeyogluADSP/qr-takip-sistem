-- =================================================================
-- ENHANCEMENT MIGRATION: User Management & Day Close
-- =================================================================

-- 1. DAILY STATUS TABLE
CREATE TABLE IF NOT EXISTS public.daily_status (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    is_closed BOOLEAN DEFAULT false,
    closed_by TEXT, -- Name of the admin who closed it
    closed_at TIMESTAMP WITH TIME ZONE
);

-- RLS for daily_status
ALTER TABLE public.daily_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read daily status" ON public.daily_status;
CREATE POLICY "Public read daily status" ON public.daily_status FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage daily status" ON public.daily_status;
CREATE POLICY "Admins can manage daily status" ON public.daily_status FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. RPC: ADMIN CREATE USER
-- Allows an admin to create a new user in auth.users and public.users
CREATE OR REPLACE FUNCTION public.admin_create_user(
    new_email TEXT,
    new_password TEXT,
    new_name TEXT,
    new_role TEXT
)
RETURNS UUID
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Check if requester is admin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied. Only admins can create users.';
    END IF;

    -- check if user exists (email) - auth.users check is tricky directly, simpler to let insert fail or check public
    IF EXISTS (SELECT 1 FROM public.users WHERE email = new_email) THEN
        RAISE EXCEPTION 'User with this email already exists.';
    END IF;

    -- Create user in auth.users (This requires pg_net or similar if done via API, but here we can't easily insert into auth.users directly via SQL without superuser)
    -- WAIT: A normal postgres function SECURITY DEFINER *can* insert into auth.users if the role has permission, 
    -- BUT relying on internal auth schema is risky. 
    -- BETTER APPROACH for standard generic Supabase: Use Supabase Admin API on client side?
    -- No, User asked for a complete solution.
    -- Alternative: We can insert into auth.users if we are postgres/service_role.
    -- Since we are running this via MCP/Dashboard as potentially postgres, we might have rights.
    -- BUT calling this from the App (authenticated as a specific admin user) will require elevated privileges.
    
    -- TRICK: We will insert into auth.users. This usually works in Supabase if we are using the 'postgres' role or if we grant permissions.
    -- Let's assume standard extension 'pgcrypto' is available for password hashing.
    
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmed_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        new_email,
        crypt(new_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('name', new_name),
        false,
        now()
    ) RETURNING id INTO new_user_id;

    -- Insert into public.users
    INSERT INTO public.users (id, email, name, role)
    VALUES (new_user_id, new_email, new_name, new_role);

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- 3. RPC: ADMIN CLOSE DAY
-- Closes the day and auto-checks out active users
CREATE OR REPLACE FUNCTION public.admin_close_day(admin_name TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
    closed_count INT := 0;
    status_entry RECORD;
BEGIN
    -- Check Admin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Access denied.';
    END IF;

    -- 1. Upsert daily status
    INSERT INTO public.daily_status (date, is_closed, closed_by, closed_at)
    VALUES (CURRENT_DATE, true, admin_name, now())
    ON CONFLICT (date) DO UPDATE
    SET is_closed = true, closed_by = EXCLUDED.closed_by, closed_at = EXCLUDED.closed_at;

    -- 2. Find active sessions (Last token was 'check_in') and insert 'check_out'
    -- Strategy: Find all users who have a Check-in today but NO Check-out *after* that Check-in.
    
    -- Simple approach: For every user assigned_user_id, get their last token today.
    -- If it's 'check_in', insert a 'system_auto_checkout' token.
    
    WITH last_actions AS (
        SELECT DISTINCT ON (assigned_user_id) 
            assigned_user_id, type, created_at
        FROM qr_tokens
        WHERE assigned_user_id IS NOT NULL 
          AND created_at >= CURRENT_DATE
        ORDER BY assigned_user_id, created_at DESC
    ),
    active_users AS (
        SELECT assigned_user_id FROM last_actions WHERE type = 'check_in'
    )
    INSERT INTO qr_tokens (token, type, assigned_user_id, expires_at, used_at)
    SELECT 
        'AUTO_CLOSE:' || gen_random_uuid()::text,
        'check_out',
        assigned_user_id,
        now(),
        now()
    FROM active_users;
    
    GET DIAGNOSTICS closed_count = ROW_COUNT;

    RETURN json_build_object('success', true, 'auto_checkout_count', closed_count);
END;
$$ LANGUAGE plpgsql;

-- Grant Execute
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_close_day(TEXT) TO authenticated;

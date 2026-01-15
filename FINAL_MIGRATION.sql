-- =================================================================
-- QR TAKIP SISTEM - GÜNCELLEME SQL SCRIPT
-- Tarih: 13.01.2026
-- =================================================================

-- 1. QR TOKENLARINA 'ASSIGNED USER' (ATANMIŞ KULLANICI) EKLEME
ALTER TABLE qr_tokens 
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;

-- 2. KULLANICI TABLOSUNU OLUŞTURMA/GÜNCELLEME
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'assistant', 'physician', 'staff')),
  is_locked_out BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- RLS (Row Level Security) Etkinleştirme
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. GÜVENLİK POLİTİKALARI (POLICIES)

-- Temizlik (Eski/Güvensiz Politikaları Kaldır)
DROP POLICY IF EXISTS "Enable insert for everyone (Kiosk)" ON qr_tokens;
DROP POLICY IF EXISTS "Enable read for admins only" ON qr_tokens;
DROP POLICY IF EXISTS "Enable read for all" ON qr_tokens;
DROP POLICY IF EXISTS "Enable insert for authenticated tokens" ON qr_tokens;
DROP POLICY IF EXISTS "Enable read access for all users" ON qr_tokens;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON qr_tokens;

DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own status" ON public.users;
CREATE POLICY "Users can update their own status" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert tokens" ON qr_tokens;
CREATE POLICY "Admins can insert tokens" ON qr_tokens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Everyone can read kiosk tokens" ON qr_tokens;
CREATE POLICY "Everyone can read kiosk tokens" ON qr_tokens FOR SELECT USING (type = 'kiosk_daily');

DROP POLICY IF EXISTS "Kiosk can insert daily tokens" ON qr_tokens;
CREATE POLICY "Kiosk can insert daily tokens" ON qr_tokens FOR INSERT WITH CHECK (type = 'kiosk_daily');

DROP POLICY IF EXISTS "Users can read their own re-entry tokens" ON qr_tokens;
CREATE POLICY "Users can read their own re-entry tokens" ON qr_tokens FOR SELECT USING (
  assigned_user_id = auth.uid()
);

-- 4. RPC FONKSİYONLARI

-- A. Asistan Listesini Getir (Sadece Admin)
CREATE OR REPLACE FUNCTION public.get_assistants_list()
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  role TEXT,
  is_locked_out BOOLEAN
) 
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied. Only admins can list assistants.';
  END IF;

  RETURN QUERY 
  SELECT u.id, au.email::VARCHAR, u.role, u.is_locked_out
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE u.role = 'assistant';
END;
$$ LANGUAGE plpgsql;

-- B. Asistan Şifresi Sıfırla ve Kilidi Aç (Admin Only)
CREATE OR REPLACE FUNCTION public.admin_generate_reentry_credentials(target_user_id UUID, new_password TEXT)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = target_user_id AND role = 'assistant') THEN
    RAISE EXCEPTION 'Invalid target user.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  UPDATE public.users
  SET is_locked_out = false
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- C. Çıkış Yaparken Kilitle (Lockout)
CREATE OR REPLACE FUNCTION public.lock_current_user()
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET is_locked_out = true
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- İzinleri Ver
GRANT EXECUTE ON FUNCTION public.get_assistants_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_reentry_credentials(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lock_current_user() TO authenticated;

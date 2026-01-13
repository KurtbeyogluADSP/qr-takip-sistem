-- 1. Function for users to lock themselves out upon logout (enforcing re-entry QR)
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

GRANT EXECUTE ON FUNCTION public.lock_current_user() TO authenticated;

-- 2. Update Admin Generator to UNLOCK user when generating new credentials
-- We drop and recreate or replace. REPLACE is fine.
CREATE OR REPLACE FUNCTION public.admin_generate_reentry_credentials(target_user_id UUID, new_password TEXT)
RETURNS VOID
SECURITY DEFINER
AS $$
BEGIN
  -- Verify Admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  -- Verify Target is an Assistant
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = target_user_id AND role = 'assistant'
  ) THEN
    RAISE EXCEPTION 'Invalid target user.';
  END IF;

  -- Update Password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  -- UNLOCK the user in public.users so they can login with this new credential
  UPDATE public.users
  SET is_locked_out = false
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql;

-- Function to fetch all users (for Admin UI) restricted to Admin role
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
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only admins can list assistants.';
  END IF;

  RETURN QUERY 
  SELECT u.id, au.email::VARCHAR, u.role, u.is_locked_out
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE u.role = 'assistant';
END;
$$ LANGUAGE plpgsql;

-- Function to set a temporary password for re-entry (Admin only)
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

  -- Verify Target is an Assistant (prevent taking over other admins)
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = target_user_id AND role = 'assistant'
  ) THEN
    RAISE EXCEPTION 'Invalid target user.';
  END IF;

  -- Update the password in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  -- Log the activity (optional, but good practice)
  -- INSERT INTO public.audit_logs ...
END;
$$ LANGUAGE plpgsql;

-- Grant access to authenticated users (RLS will handle actual restrictions inside the function)
GRANT EXECUTE ON FUNCTION public.get_assistants_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_generate_reentry_credentials(UUID, TEXT) TO authenticated;

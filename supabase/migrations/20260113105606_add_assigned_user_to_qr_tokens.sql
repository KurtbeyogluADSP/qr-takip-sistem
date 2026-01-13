-- Add assigned_user_id to qr_tokens for targeted re-entry
ALTER TABLE qr_tokens 
ADD COLUMN assigned_user_id UUID REFERENCES auth.users(id),
ADD COLUMN used_at TIMESTAMP WITH TIME ZONE;

-- Add is_locked_out to profiles/users table (assuming 'profiles' exists or we use auth metadata)
-- For MVP, we'll create a simple 'user_status' table if 'profiles' doesn't exist, or alter it.
-- Let's check if 'users' table in public schema exists first. If not, we create it based on SOP.
-- SOP said: users: id, email, name, role...

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'assistant')),
  is_locked_out BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Ensure RLS is enabled
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own status" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for qr_tokens
-- Only admins can INSERT re_entry tokens
-- Assistants can SELECT tokens assigned to them OR type='kiosk_daily'
CREATE POLICY "Admins can insert tokens" ON qr_tokens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Everyone can read kiosk tokens" ON qr_tokens FOR SELECT USING (type = 'kiosk_daily');

CREATE POLICY "Users can read their own re-entry tokens" ON qr_tokens FOR SELECT USING (
  assigned_user_id = auth.uid()
);

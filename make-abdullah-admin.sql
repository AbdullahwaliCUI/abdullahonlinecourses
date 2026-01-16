-- Run this query in the Supabase SQL Editor

-- 1. Update the public.profiles table
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'abdullahwale@gmail.com');

-- 2. Update the auth.users metadata (to ensure parity)
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'abdullahwale@gmail.com';

-- 3. Verify the change
SELECT id, role FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'abdullahwale@gmail.com');

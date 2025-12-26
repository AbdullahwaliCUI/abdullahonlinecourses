-- Simple Admin User Creation Method
-- This method directly inserts into auth.users table

-- Step 1: Create auth user with encrypted password
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User", "phone": "+923001234567"}',
  NOW(),
  NOW(),
  '',
  ''
);

-- Step 2: The trigger will automatically create profile, but let's ensure admin role
UPDATE profiles 
SET role = 'admin',
    full_name = 'Admin User',
    phone = '+923001234567'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@test.com'
);
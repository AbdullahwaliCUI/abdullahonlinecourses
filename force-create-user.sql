-- FORCE CREATE USER SCRIPT
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Disable the trigger that causes the crash
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create the user manually (Raw SQL Insert)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID so we can find it later
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"System Admin","role":"admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 3. Create the profile for this user
INSERT INTO public.profiles (id, full_name, role)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'System Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

SELECT 'User admin@example.com created successfully!' as result;

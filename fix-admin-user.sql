-- Fix Admin User Creation
-- First delete if exists, then recreate

-- Delete existing user if any
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);

DELETE FROM auth.users WHERE email = 'admin@test.com';

-- Create new admin user
DO $$
DECLARE
    user_id uuid := gen_random_uuid();
BEGIN
    -- Insert into auth.users
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
        user_id,
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
    
    -- Insert into profiles
    INSERT INTO profiles (
        id,
        full_name,
        phone,
        role,
        created_at
    ) VALUES (
        user_id,
        'Admin User',
        '+923001234567',
        'admin',
        NOW()
    );
    
    RAISE NOTICE 'Admin user created successfully with ID: %', user_id;
END $$;
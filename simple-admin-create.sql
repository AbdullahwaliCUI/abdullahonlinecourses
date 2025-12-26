-- Simple admin user creation
-- Delete any existing test users first
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);
DELETE FROM auth.users WHERE email LIKE '%test%';

-- Create simple admin user
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        new_user_id,
        'authenticated',
        'authenticated',
        'simple@admin.com',
        crypt('simple123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '',
        ''
    );
    
    -- Create profile
    INSERT INTO profiles (
        id,
        full_name,
        phone,
        role,
        created_at
    ) VALUES (
        new_user_id,
        'Simple Admin',
        '+923001234567',
        'admin',
        NOW()
    );
    
    RAISE NOTICE 'Simple admin created: simple@admin.com / simple123';
END $$;
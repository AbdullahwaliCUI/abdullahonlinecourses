-- Direct user creation bypassing all constraints
-- This method directly inserts into auth.users table

DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    hashed_password text;
BEGIN
    -- Generate hashed password
    hashed_password := crypt('admin123', gen_salt('bf'));
    
    -- Insert directly into auth.users (bypassing RLS)
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
        new_user_id,
        'authenticated',
        'authenticated',
        'final@admin.com',
        hashed_password,
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Final Admin","role":"admin"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Insert profile
    INSERT INTO profiles (id, full_name, phone, role, created_at)
    VALUES (
        new_user_id,
        'Final Admin',
        '+923001234567',
        'admin',
        NOW()
    );
    
    RAISE NOTICE 'User created successfully: final@admin.com / admin123';
    RAISE NOTICE 'User ID: %', new_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Verify user creation
SELECT 
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'final@admin.com';
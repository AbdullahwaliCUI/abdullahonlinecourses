-- FIX SCRIPT FOR AUTH ERROR

-- 1. Drop the problematic trigger that is blocking user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create the admin user directly (bypassing Supabase Auth API to avoid other triggers)
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    admin_email text := 'admin@example.com';
BEGIN
    -- Only create if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            admin_email,
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"System Admin","role":"admin"}',
            now(),
            now()
        );
        RAISE NOTICE 'User created in auth.users';
    ELSE
        SELECT id INTO new_user_id FROM auth.users WHERE email = admin_email;
        RAISE NOTICE 'User already exists, ID: %', new_user_id;
    END IF;

    -- 3. Create the profile manually
    INSERT INTO profiles (id, full_name, role)
    VALUES (new_user_id, 'System Admin', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin'; -- Ensure they are admin

    RAISE NOTICE 'Profile successfully created/updated';
END $$;

-- FINAL AUTH FIX SCRIPT

-- 1. Drop existing items to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Create a "Safe" Trigger Function
-- This function catches errors so they don't block user creation in the dashboard
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'student' -- Default role
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid errors if profile exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-enable the Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Ensure Admin User Exists & Has Correct Profile
DO $$
DECLARE
    admin_uid uuid;
    admin_email text := 'admin@example.com';
BEGIN
    -- Check if auth user exists
    SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email;
    
    -- If not, created via raw insert (last resort, dashboard creation is preferred now that trigger is fixed)
    IF admin_uid IS NULL THEN
        admin_uid := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated', 
            admin_email, crypt('admin123', gen_salt('bf')), now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"System Admin","role":"admin"}', now(), now()
        );
        RAISE NOTICE 'Admin auth user created.';
    ELSE
        RAISE NOTICE 'Admin auth user exists.';
    END IF;

    -- Ensure Profile Exists and is Admin
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (admin_uid, 'System Admin', 'admin')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin';
    
    RAISE NOTICE 'Admin profile verified.';
END $$;

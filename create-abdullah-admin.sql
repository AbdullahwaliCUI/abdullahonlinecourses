-- Variable for the new admin email and password
-- You can run this in the Supabase SQL Editor

DO $$
DECLARE
  new_email TEXT := 'abdullahwale@gmail.com';
  new_password TEXT := 'admin123';
  new_full_name TEXT := 'Abdullah Wali';
  target_user_id UUID;
BEGIN
  -- 1. Check if user exists in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = new_email;

  IF target_user_id IS NOT NULL THEN
    -- User exists, update password and metadata
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('full_name', new_full_name, 'role', 'admin'),
        email_confirmed_at = now()
    WHERE id = target_user_id;
    
    RAISE NOTICE 'User % exists. Password and metadata updated.', new_email;
  ELSE
    -- User does not exist, create new user
    target_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
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
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      target_user_id,
      '00000000-0000-0000-0000-000000000000',
      target_user_id,
      'authenticated',
      'authenticated',
      new_email,
      crypt(new_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', new_full_name, 'role', 'admin'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Created new user %.', new_email;
  END IF;

  -- 2. Ensure profile exists in public.profiles with admin role
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (target_user_id, new_email, new_full_name, 'admin', now())
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      full_name = new_full_name,
      email = new_email;

  RAISE NOTICE 'Profile synced for user % with role admin.', new_email;

END $$;

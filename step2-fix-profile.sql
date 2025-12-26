-- STEP 2: FIX PROFILE
-- Run this AFTER creating the user 'admin@example.com' in the dashboard.

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user you just created
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@example.com';

  IF target_user_id IS NOT NULL THEN
    -- Manually create the profile since we turned off the automation
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (target_user_id, 'System Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Fixed profile for admin@example.com';
  ELSE
    RAISE WARNING 'User admin@example.com not found! Did you create it in the dashboard?';
  END IF;
END $$;

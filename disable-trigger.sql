-- Completely disable the trigger to avoid user creation issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Verify trigger is removed
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users';
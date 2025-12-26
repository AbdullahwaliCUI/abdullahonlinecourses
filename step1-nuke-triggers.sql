-- STEP 1: REMOVE ALL CHECKS
-- This script completely removes the automation to verify if it was the cause of the error.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Now try creating the user in the dashboard. It should work because there is nothing to block it.

-- FIX INFINITE RECURSION IN POLICIES

-- The error 'infinite recursion' happens because the policy checks 'profiles' to see if you are admin,
-- but checking 'profiles' requires passing the policy, creating a loop.

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "admin read profiles" ON profiles;
DROP POLICY IF EXISTS "read own profile" ON profiles;

-- 2. Create simpler policies that don't loop
-- Allow users to read their OWN profile (essential for login)
CREATE POLICY "read own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow admins to read ALL profiles, but avoiding recursion by trusting the JWT claims or using a different lookup if needed.
-- For now, let's keep it simple: Admins can read everything, but we check role from the row itself or trust the auth.
-- A common safe pattern is:

CREATE POLICY "admin read all profiles" ON profiles 
FOR SELECT USING (
  role = 'admin' -- Admin can read their own profile (covered above, but safe here)
  OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' -- This might still recurse!
);

-- BETTER FIX: Break the recursion using a SECURITY DEFINER function or by simplifying.
-- Simplest Fix for now: Everyone can read basic profile info (needed for team names etc sometimes), 
-- OR just strictly scope it.

-- Let's use the standard "Read Own" + "Admin Read All" but be careful.
-- If the "Admin Read All" policy SELECTS from profiles, it triggers the policy again.

-- SAFE APPROACH:
DROP POLICY IF EXISTS "admin read profiles" ON profiles;

-- Redefine: Admin policy using a direct check without sub-query if possible, or use a function.
-- Actually, the recursion happens because 'admin read profiles' tries to SELECT FROM profiles where id = auth.uid().
-- If we just allow "Read Own" securely, that solves the login issue.

-- FIX:
-- 1. "read own profile" -> USING (auth.uid() = id); -> SAFE
-- 2. "admin read all" -> REMOVE for now to unblock login. Accessing other profiles is rarely needed during simple login.

-- If you need admin access, enable it but ensure it doesn't trigger on itself.
-- Correct pattern to avoid recursion:
-- Use `auth.jwt() ->> 'role'` if you synced role to JWT, but we haven't.
-- OR just rely on "read own" for the redirect logic. The logs show the error happened during login.

-- LET'S JUST APPLY "READ OWN" and "READ PUBLIC IF NEEDED". 
-- The login code does: .select('role').eq('id', authData.user.id).single()
-- This ONLY needs "Read Own".

-- So, deleting the "admin read profiles" policy might technically fix the login crash, 
-- but Admins need to see the student list.

-- PROPER NON-RECURSIVE ADMIN POLICY:
-- We can't query "profiles" to check if we are admin to query "profiles".
-- WE MUST BREAK THE LOOP. 
-- One way: Create a function `is_admin()` that is `SECURITY DEFINER` (bypasses RLS).

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER is key! It runs as superuser/creator, ignoring RLS.

-- Now use this function in the policy
CREATE POLICY "admin read all profiles" ON profiles 
FOR SELECT USING (
  is_admin()
);

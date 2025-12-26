-- Fix profile fetch issue
-- Update profile with correct data
UPDATE profiles 
SET 
    full_name = 'Final Admin',
    phone = '+923001234567',
    role = 'admin',
    created_at = NOW()
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'final@admin.com'
);

-- Verify profile data
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.full_name,
    p.phone,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'final@admin.com';

-- Check if there are any RLS policy issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';
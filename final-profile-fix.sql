-- Fix profile for the created user
-- Use dynamic approach to get the correct user ID

UPDATE profiles 
SET 
    full_name = 'Final Admin',
    phone = '+923001234567',
    role = 'admin'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'final@admin.com'
);

-- If profile doesn't exist, create it
INSERT INTO profiles (id, full_name, phone, role, created_at)
SELECT 
    u.id,
    'Final Admin',
    '+923001234567',
    'admin',
    NOW()
FROM auth.users u
WHERE u.email = 'final@admin.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = u.id
);

-- Verify profile
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'final@admin.com';
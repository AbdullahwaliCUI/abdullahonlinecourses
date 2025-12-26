-- Create profile for test@admin.com user
INSERT INTO profiles (id, full_name, phone, role, created_at)
SELECT 
    id,
    'Test Admin',
    '+923001234567',
    'admin',
    NOW()
FROM auth.users 
WHERE email = 'test@admin.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);

-- Verify the profile was created
SELECT 
    u.email,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'test@admin.com';
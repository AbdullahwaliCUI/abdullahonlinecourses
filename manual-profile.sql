-- Create profile manually for the new user
INSERT INTO profiles (id, full_name, phone, role, created_at)
SELECT 
    id,
    'Admin User',
    '+923001234567',
    'admin',
    NOW()
FROM auth.users 
WHERE email = 'admin@lms.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);

-- Verify profile was created
SELECT 
    u.email,
    p.full_name,
    p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@lms.com';
-- Reset admin password
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'admin@test.com';

-- Verify update
SELECT 
    email,
    updated_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'admin@test.com';
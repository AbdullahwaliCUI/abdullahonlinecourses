-- Reset password for test@admin.com
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'test@admin.com';

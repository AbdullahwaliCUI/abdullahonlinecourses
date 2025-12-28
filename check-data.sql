-- Check if courses exist in database
SELECT 
    id,
    title,
    description,
    image_url,
    is_active,
    created_by,
    created_at
FROM courses;

-- Check if user exists and has admin role
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'final@admin.com';

-- Check RLS policies for courses
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'courses';
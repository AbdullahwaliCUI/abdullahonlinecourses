-- Test course creation directly in database
INSERT INTO courses (title, description, image_url, created_by, is_active)
SELECT 
    'Test Course',
    'This is a test course',
    'https://img.youtube.com/vi/1ukSR1GRtMU/maxresdefault.jpg',
    u.id,
    true
FROM auth.users u
WHERE u.email = 'final@admin.com';

-- Verify course was created
SELECT 
    c.id,
    c.title,
    c.description,
    c.created_by,
    u.email as created_by_email
FROM courses c
JOIN auth.users u ON c.created_by = u.id;
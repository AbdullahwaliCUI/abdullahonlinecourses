-- Create a fresh course with proper admin user
INSERT INTO courses (
    id,
    title, 
    description, 
    image_url, 
    is_active, 
    created_by,
    created_at
) VALUES (
    gen_random_uuid(),
    'Complete Web Development',
    'Learn HTML, CSS, JavaScript, and React from scratch',
    'https://img.youtube.com/vi/UB1O30fR-EE/maxresdefault.jpg',
    true,
    (SELECT id FROM auth.users WHERE email = 'final@admin.com'),
    NOW()
);

-- Verify course creation
SELECT 
    id,
    title,
    description,
    is_active,
    created_by,
    created_at
FROM courses;

-- Check total count
SELECT COUNT(*) as total_courses FROM courses;
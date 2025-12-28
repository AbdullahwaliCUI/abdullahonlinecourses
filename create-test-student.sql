-- Create test student user and enrollment
DO $$
DECLARE
    student_user_id uuid := gen_random_uuid();
    course_id_var uuid;
BEGIN
    -- Get the course ID
    SELECT id INTO course_id_var FROM courses WHERE title = 'Complete Web Development' LIMIT 1;
    
    -- Create student auth user
    INSERT INTO auth.users (
        id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        student_user_id, 'authenticated', 'authenticated',
        'student@test.com', crypt('student123', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Test Student"}'
    );
    
    -- Create student profile
    INSERT INTO profiles (id, full_name, phone, role, created_at)
    VALUES (
        student_user_id,
        'Test Student',
        '+923001234567',
        'student',
        NOW()
    );
    
    -- Create active enrollment
    INSERT INTO enrollments (user_id, course_id, status, created_at)
    VALUES (
        student_user_id,
        course_id_var,
        'active',
        NOW()
    );
    
    -- Initialize first topic progress (unlock first topic)
    INSERT INTO progress (user_id, course_id, topic_id, is_unlocked, is_completed, updated_at)
    SELECT 
        student_user_id,
        course_id_var,
        t.id,
        true,
        false,
        NOW()
    FROM topics t
    WHERE t.course_id = course_id_var AND t.order_index = 1;
    
    RAISE NOTICE 'Test student created: student@test.com / student123';
    RAISE NOTICE 'Student ID: %', student_user_id;
    RAISE NOTICE 'Enrolled in course: %', course_id_var;
    
END $$;

-- Verify student creation
SELECT 
    u.email,
    p.full_name,
    p.role,
    e.status as enrollment_status,
    c.title as course_title
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN courses c ON e.course_id = c.id
WHERE u.email = 'student@test.com';
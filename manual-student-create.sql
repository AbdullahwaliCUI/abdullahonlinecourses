-- Manual student creation for the enrollment request
DO $$
DECLARE
    student_user_id uuid := gen_random_uuid();
    request_id_var uuid;
    course_id_var uuid;
BEGIN
    -- Get the enrollment request ID (latest pending request)
    SELECT id, course_id INTO request_id_var, course_id_var 
    FROM enrollment_requests 
    WHERE status = 'pending' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Create student auth user
    INSERT INTO auth.users (
        id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data
    ) VALUES (
        student_user_id, 'authenticated', 'authenticated',
        'abdullahwale@gmail.com', crypt('student123', gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Wali Muhammad"}'
    );
    
    -- Create student profile
    INSERT INTO profiles (id, full_name, phone, role, created_at)
    VALUES (
        student_user_id,
        'Wali Muhammad',
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
    
    -- Initialize first topic progress
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
    
    -- Update enrollment request status
    UPDATE enrollment_requests 
    SET 
        status = 'verified',
        processed_by = (SELECT id FROM auth.users WHERE email = 'final@admin.com'),
        processed_at = NOW(),
        created_user_id = student_user_id,
        notes = 'Manually verified via SQL'
    WHERE id = request_id_var;
    
    RAISE NOTICE 'Student created: abdullahwale@gmail.com / student123';
    RAISE NOTICE 'Student ID: %', student_user_id;
    
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
WHERE u.email = 'abdullahwale@gmail.com';
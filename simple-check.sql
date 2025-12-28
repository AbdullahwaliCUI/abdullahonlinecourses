-- Simple course count check
SELECT COUNT(*) as total_courses FROM courses;

-- Check if any courses are active
SELECT COUNT(*) as active_courses FROM courses WHERE is_active = true;

-- Check specific course we created
SELECT * FROM courses WHERE title = 'Test Course';

-- Check current user session (if any)
SELECT current_user, session_user;
-- Temporarily disable RLS for courses to test
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Check if courses are visible now
SELECT 
    id,
    title,
    description,
    is_active,
    created_at
FROM courses;

-- Re-enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
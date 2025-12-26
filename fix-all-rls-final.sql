-- FIX ALL RLS POLICIES TO USE is_admin()
-- This replaces the recursive "EXISTS (SELECT 1 FROM profiles...)" check with the safe "is_admin()" function.

-- 1. Ensure is_admin() exists and is secure
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. COURSES: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage courses" ON courses;
CREATE POLICY "admin manage courses" ON courses FOR ALL USING (is_admin());

-- 3. TOPICS: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage topics" ON topics;
CREATE POLICY "admin manage topics" ON topics FOR ALL USING (is_admin());

-- 4. VIDEOS: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage videos" ON videos;
CREATE POLICY "admin manage videos" ON videos FOR ALL USING (is_admin());

-- 5. TESTS: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage tests" ON tests;
CREATE POLICY "admin manage tests" ON tests FOR ALL USING (is_admin());

-- 6. ENROLLMENTS: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage enrollments" ON enrollments;
CREATE POLICY "admin manage enrollments" ON enrollments FOR ALL USING (is_admin());

-- 7. ENROLLMENT REQUESTS: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage enrollment_requests" ON enrollment_requests;
CREATE POLICY "admin manage enrollment_requests" ON enrollment_requests FOR ALL USING (is_admin());

-- 8. PROGRESS: Fix Admin Policy
DROP POLICY IF EXISTS "admin manage progress" ON progress;
CREATE POLICY "admin manage progress" ON progress FOR ALL USING (is_admin());

-- 9. TEST ATTEMPTS: Fix Admin Update Policy
DROP POLICY IF EXISTS "update attempts admin" ON test_attempts;
CREATE POLICY "update attempts admin" ON test_attempts FOR UPDATE USING (is_admin());

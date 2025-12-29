-- Migration: Add Instructor Role and Permissions

-- 1. Update Profiles Role Check
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('student', 'admin', 'instructor'));

-- 2. Create Course Instructors Table
CREATE TABLE IF NOT EXISTS course_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, instructor_id)
);

-- 3. Enable RLS
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Instructors can read their own assignments
DROP POLICY IF EXISTS "instructors read own assignments" ON course_instructors;
CREATE POLICY "instructors read own assignments" ON course_instructors
FOR SELECT USING (instructor_id = auth.uid());

-- Admin full access to course_instructors
DROP POLICY IF EXISTS "admin manage course_instructors" ON course_instructors;
CREATE POLICY "admin manage course_instructors" ON course_instructors
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Request Management: Instructor sees requests for their courses
DROP POLICY IF EXISTS "instructor manage requests" ON enrollment_requests;
CREATE POLICY "instructor manage requests" ON enrollment_requests
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_instructors ci 
    WHERE ci.instructor_id = auth.uid() 
    AND ci.course_id = enrollment_requests.course_id
  )
);

-- Content Management: Instructor sees their courses
DROP POLICY IF EXISTS "instructor view courses" ON courses;
CREATE POLICY "instructor view courses" ON courses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_instructors ci 
    WHERE ci.instructor_id = auth.uid() 
    AND ci.course_id = courses.id
  )
);

-- Topics: Instructor views topics for their courses
DROP POLICY IF EXISTS "instructor view topics" ON topics;
CREATE POLICY "instructor view topics" ON topics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_instructors ci 
    WHERE ci.instructor_id = auth.uid() 
    AND ci.course_id = topics.course_id
  )
);

-- Videos: Instructor views videos for their courses
DROP POLICY IF EXISTS "instructor view videos" ON videos;
CREATE POLICY "instructor view videos" ON videos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM topics t
    JOIN course_instructors ci ON ci.course_id = t.course_id
    WHERE t.id = videos.topic_id
    AND ci.instructor_id = auth.uid()
  )
);

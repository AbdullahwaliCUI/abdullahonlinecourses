-- =====================================================
-- LMS Platform Database Schema for Supabase
-- =====================================================

-- Profiles for roles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text CHECK (role IN ('student','admin')) DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- Courses & content
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text, -- YouTube thumbnail or GitHub raw
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  youtube_url text NOT NULL,
  helper_material_url text,
  created_at timestamptz DEFAULT now()
);

-- Public enrollment & payment request (no auth required; handled via server with service role)
CREATE TABLE enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text, -- optional; if missing, admin can generate a synthetic email
  transaction_id text NOT NULL,
  receipt_url text NOT NULL, -- external URL (GitHub raw, CDN link)
  status text CHECK (status IN ('pending','verified','rejected')) DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_by uuid REFERENCES profiles(id),
  processed_at timestamptz,
  created_user_id uuid REFERENCES auth.users(id), -- set after admin creates the user
  UNIQUE (transaction_id) -- Prevent duplicate transaction IDs
);

-- Final enrollment linked to auth user
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  status text CHECK (status IN ('active','completed','revoked')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- Tests & marks
CREATE TABLE tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  marks_obtained numeric,
  total_marks numeric,
  status text CHECK (status IN ('scheduled','attempted','graded')) DEFAULT 'scheduled',
  graded_by uuid REFERENCES profiles(id),
  graded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (test_id, user_id)
);

CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  is_unlocked boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id, topic_id)
);

-- Scoreboard view
CREATE VIEW course_scoreboard AS
SELECT
  ta.user_id,
  t.course_id,
  SUM(COALESCE(ta.marks_obtained,0)) AS total_marks,
  SUM(COALESCE(ta.total_marks,0)) AS total_possible
FROM test_attempts ta
JOIN tests t ON t.id = ta.test_id
GROUP BY ta.user_id, t.course_id;

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Public read for active courses & topics/videos
CREATE POLICY "public read courses" ON courses 
FOR SELECT USING (is_active = true);

CREATE POLICY "public read topics" ON topics 
FOR SELECT USING (true);

CREATE POLICY "public read videos" ON videos 
FOR SELECT USING (true);

-- Profiles
CREATE POLICY "read own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin read profiles" ON profiles 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Enrollments: students read own
CREATE POLICY "read own enrollments" ON enrollments 
FOR SELECT USING (user_id = auth.uid());

-- test_attempts: students read own, admin updates
CREATE POLICY "read own attempts" ON test_attempts 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert own attempt" ON test_attempts 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update attempts admin" ON test_attempts 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- progress: student reads own, admin updates
CREATE POLICY "read own progress" ON progress 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "update progress admin" ON progress 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- enrollment_requests: only admin reads; inserts happen via server with service role
CREATE POLICY "admin read enrollment_requests" ON enrollment_requests 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- =====================================================
-- Admin Policies (Full CRUD for admins)
-- =====================================================

-- Courses: Admin can manage all
CREATE POLICY "admin manage courses" ON courses 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Topics: Admin can manage all
CREATE POLICY "admin manage topics" ON topics 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Videos: Admin can manage all
CREATE POLICY "admin manage videos" ON videos 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Tests: Admin can manage all
CREATE POLICY "admin manage tests" ON tests 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Enrollments: Admin can manage all
CREATE POLICY "admin manage enrollments" ON enrollments 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Enrollment requests: Admin can manage all
CREATE POLICY "admin manage enrollment_requests" ON enrollment_requests 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Progress: Admin can manage all
CREATE POLICY "admin manage progress" ON progress 
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update progress timestamps
CREATE OR REPLACE FUNCTION update_progress_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress timestamp
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_progress_timestamp();

-- =====================================================
-- Initial Data (Optional)
-- =====================================================

-- Note: You can add sample data here if needed
-- Example:
-- INSERT INTO courses (title, description, image_url, is_active) VALUES
-- ('Sample Course', 'A sample course for testing', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', true);

-- =====================================================
-- Important Notes:
-- =====================================================

/*
SECURITY NOTES:
1. enrollment_requests table intentionally has no INSERT policy for anonymous users
2. All inserts to enrollment_requests should be done via Next.js API routes using the service role
3. This prevents direct database access and ensures proper validation
4. The service role bypasses RLS, so use it carefully in server-side code only

USAGE NOTES:
1. Students can read their own data and public course content
2. Admins have full CRUD access to all tables
3. Public users can browse courses, topics, and videos without authentication
4. Progress tracking is handled automatically via triggers
5. The course_scoreboard view provides aggregated test results
*/
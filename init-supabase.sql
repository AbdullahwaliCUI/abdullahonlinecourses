-- =====================================================
-- LMS Platform Database Schema & Setup for Supabase
-- =====================================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if needed (Optional - careful with this)
-- DROP TABLE IF EXISTS progress CASCADE;
-- DROP TABLE IF EXISTS test_attempts CASCADE;
-- DROP TABLE IF EXISTS tests CASCADE;
-- DROP TABLE IF EXISTS enrollments CASCADE;
-- DROP TABLE IF EXISTS enrollment_requests CASCADE;
-- DROP TABLE IF EXISTS videos CASCADE;
-- DROP TABLE IF EXISTS topics CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Create Tables

-- Profiles for roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text CHECK (role IN ('student','admin')) DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- Courses & content
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  youtube_url text NOT NULL,
  helper_material_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  transaction_id text NOT NULL,
  receipt_url text NOT NULL,
  status text CHECK (status IN ('pending','verified','rejected')) DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  processed_by uuid REFERENCES profiles(id),
  processed_at timestamptz,
  created_user_id uuid REFERENCES auth.users(id),
  UNIQUE (transaction_id)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  status text CHECK (status IN ('active','completed','revoked')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_attempts (
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

CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  is_unlocked boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id, topic_id)
);

-- 4. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- 5. Policies

-- Public read policies
DROP POLICY IF EXISTS "public read courses" ON courses;
CREATE POLICY "public read courses" ON courses FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "public read topics" ON topics;
CREATE POLICY "public read topics" ON topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "public read videos" ON videos;
CREATE POLICY "public read videos" ON videos FOR SELECT USING (true);

-- Profile policies
DROP POLICY IF EXISTS "read own profile" ON profiles;
CREATE POLICY "read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin read profiles" ON profiles;
CREATE POLICY "admin read profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Enrollment policies
DROP POLICY IF EXISTS "read own enrollments" ON enrollments;
CREATE POLICY "read own enrollments" ON enrollments FOR SELECT USING (user_id = auth.uid());

-- Test attempt policies
DROP POLICY IF EXISTS "read own attempts" ON test_attempts;
CREATE POLICY "read own attempts" ON test_attempts FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert own attempt" ON test_attempts;
CREATE POLICY "insert own attempt" ON test_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update attempts admin" ON test_attempts;
CREATE POLICY "update attempts admin" ON test_attempts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Progress policies
DROP POLICY IF EXISTS "read own progress" ON progress;
CREATE POLICY "read own progress" ON progress FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "update progress admin" ON progress;
CREATE POLICY "update progress admin" ON progress FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

-- Admin policies (All access)
DROP POLICY IF EXISTS "admin manage courses" ON courses;
CREATE POLICY "admin manage courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

DROP POLICY IF EXISTS "admin manage topics" ON topics;
CREATE POLICY "admin manage topics" ON topics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

DROP POLICY IF EXISTS "admin manage videos" ON videos;
CREATE POLICY "admin manage videos" ON videos FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

DROP POLICY IF EXISTS "admin manage tests" ON tests;
CREATE POLICY "admin manage tests" ON tests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

DROP POLICY IF EXISTS "admin manage enrollments" ON enrollments;
CREATE POLICY "admin manage enrollments" ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

DROP POLICY IF EXISTS "admin manage enrollment_requests" ON enrollment_requests;
CREATE POLICY "admin manage enrollment_requests" ON enrollment_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);

DROP POLICY IF EXISTS "admin manage progress" ON progress;
CREATE POLICY "admin manage progress" ON progress FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role='admin')
);


-- 6. Functions and Triggers

-- Handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, still allow user creation
    -- This prevents auth signup from being blocked by profile errors
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication error on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_progress_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_progress_updated_at ON progress;
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_progress_timestamp();


-- 7. Create Default Admin User
-- This inserts directly into auth.users. The trigger above will handle the profile creation.
DO $$
DECLARE
    new_user_id uuid := gen_random_uuid();
    admin_email text := 'admin@example.com';
    admin_password text := 'admin123';
BEGIN
    -- Only create if user doesn't exist
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
        INSERT INTO auth.users (
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token
        ) VALUES (
            new_user_id,
            'authenticated',
            'authenticated',
            admin_email,
            crypt(admin_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"System Admin","role":"admin","phone":"+00000000000"}',
            NOW(),
            NOW(),
            '',
            ''
        );
        RAISE NOTICE 'Admin user created: %', admin_email;
    ELSE
        RAISE NOTICE 'Admin user already exists: %', admin_email;
    END IF;
END $$;

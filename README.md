# Next.js 15 LMS Platform

A Learning Management System built with Next.js 15, Supabase, and TypeScript.

## 🚀 Quick Deployment Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Authentication** → **Settings** → **Configuration**
4. Enable **Email** provider (should be enabled by default)
5. Note down your project URL and API keys from **Settings** → **API**

### 2. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query and paste the complete SQL schema from the setup (see Database Schema section below)
3. Run the query to create all tables, policies, and functions

### 3. Configure Environment Variables

In your **Vercel Project Settings** → **Environment Variables**, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_JAZZCASH_NUMBER=+923046983794
```

⚠️ **CRITICAL**: `SUPABASE_SERVICE_ROLE_KEY` is server-side only and should never be exposed to the client!

### 4. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Deploy the project
3. Verify all environment variables are set correctly

### 5. Create Your First Admin User

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add User** → **Create new user**
3. Enter email and password
4. After user is created, go to **Table Editor** → **profiles**
5. Find the user and update their `role` to `'admin'`

**Option B: Via Local Script**
Create a one-time setup script:

```javascript
// setup-admin.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY'
)

async function createAdmin() {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@yourdomain.com',
    password: 'your-secure-password',
    email_confirm: true,
    user_metadata: {
      full_name: 'Admin User',
      role: 'admin'
    }
  })

  if (authError) {
    console.error('Error creating admin:', authError)
    return
  }

  console.log('Admin user created successfully!')
  console.log('Email:', authData.user.email)
  console.log('Please save these credentials securely.')
}

createAdmin()
```

### 6. Start Managing Your LMS

1. Visit your deployed site at `https://your-app.vercel.app`
2. Go to `/login` and sign in with your admin credentials
3. Navigate to **Admin** → **Requests** to start processing student enrollments
4. Use **Admin** → **Courses** to create and manage course content

## 🔐 Security Notes

- **Passwords are NOT stored in the database** - they're managed by Supabase Auth
- **Admin must share credentials securely** with students after verification
- **For password resets**: Admin can update passwords via Supabase Dashboard → Authentication → Users
- **Service role key**: Never expose to client-side code - only use in server actions and API routes

## 📋 Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
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
RETURNS trigger AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update progress timestamps
CREATE OR REPLACE FUNCTION update_progress_timestamp()
RETURNS trigger AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to update progress timestamp
CREATE TRIGGER update_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_progress_timestamp();
```

## 🚨 IMPORTANT SECURITY NOTE

**NEVER import `SUPABASE_SERVICE_ROLE_KEY` in client components!**

The service role key should ONLY be used in:
- Server-side API routes (`/app/api/`)
- Server actions
- Server components (with extreme caution)

Always use the appropriate Supabase client:
- `@/lib/supabase/client` - For client components (browser)
- `@/lib/supabase/server` - For server components and server actions
- `@/lib/supabase/admin` - For admin operations (server-side only)

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_JAZZCASH_NUMBER=+923046983794
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env.local`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## System Architecture

### Auth Helpers

The `lib/auth.ts` file provides convenient server-side auth helpers:

- `getSession()` - Get current session
- `getUser()` - Get current user
- `getProfile()` - Get user profile from database
- `getRole()` - Get user role ('student' | 'admin')

These helpers use the server client and should only be called from server components or API routes.

### Content Visibility System

The `lib/visibility.ts` file provides helpers for managing course content visibility:

- `getVisibleTopicsForPublic(courseId)` - Returns topics visible to non-enrolled users (50% of total)
- `getIsEnrolledActive(userId, courseId)` - Checks if user has active enrollment
- `getUserEnrollmentStatus(userId, courseId)` - Gets comprehensive enrollment status

### Content Access Rules

- **Public Users**: Can browse courses and see first 50% of topics as preview
- **Enrolled Students**: Get full access to all course content and can progress through topics
- **Admin Users**: Have full access to manage all content and user enrollments

The course details page (`/courses/[id]`) automatically shows:
- Preview content with "locked" indicators for non-enrolled users
- Full content with navigation links for enrolled students
- Clear enrollment CTAs for users who need to request access

### Progress Management

The system includes automatic progress tracking:

- **First Topic Unlock**: Automatically unlocked when student enrollment is verified
- **Progressive Unlocking**: Topics unlock sequentially after passing tests (≥60%)
- **Completion Tracking**: Students can mark topics as completed
- **Admin Control**: Admins can grade tests and manage student progress

## User Workflows

### For Students
1. Browse public course catalog
2. Submit enrollment request with payment proof
3. Wait for admin verification
4. Receive login credentials
5. Access course content progressively
6. Complete topics and take tests

### For Admins
1. Log in to admin panel
2. Review enrollment requests
3. Verify payments and create student accounts
4. Manage course content (courses, topics, videos)
5. Grade student tests
6. Monitor student progress

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Validation**: Zod
- **UI Components**: Custom with Tailwind CSS

## License

MIT
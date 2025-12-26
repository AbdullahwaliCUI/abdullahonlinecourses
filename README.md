# Next.js 15 LMS Platform

A Learning Management System built with Next.js 15, Supabase, and TypeScript.

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

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Navbar
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles with Tailwind
├── components/
│   └── Navbar.tsx              # Navigation component
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client (anon key)
│   │   ├── server.ts           # Server client (cookies)
│   │   └── admin.ts            # Admin client (service role)
│   └── auth.ts                 # Auth helper functions
```

## Getting Started

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

## Auth Helpers

The `lib/auth.ts` file provides convenient server-side auth helpers:

- `getSession()` - Get current session
- `getUser()` - Get current user
- `getProfile()` - Get user profile from database
- `getRole()` - Get user role ('student' | 'admin')

These helpers use the server client and should only be called from server components or API routes.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## License

MIT
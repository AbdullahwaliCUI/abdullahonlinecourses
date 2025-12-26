import { createClient } from '@supabase/supabase-js'

// WARNING: This client uses the service role key and should ONLY be used in:
// - Server-side API routes
// - Server actions
// - Server components (with caution)
// NEVER import this in client components!

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
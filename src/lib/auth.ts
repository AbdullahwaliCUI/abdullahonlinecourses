import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

export async function getSession() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getProfile() {
  const user = await getUser()
  if (!user) return null

  const supabase = createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return profile
  } catch (error) {
    console.error('Error getting profile:', error)
    return null
  }
}

export async function getRole(): Promise<'student' | 'admin' | null> {
  const profile = await getProfile()
  return profile?.role || null
}
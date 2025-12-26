'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(email: string, password: string) {
  const supabase = await createClient()

  try {
    // Attempt to sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Login failed' }
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { error: 'Failed to get user profile' }
    }

    // Revalidate the current path to update auth state
    revalidatePath('/', 'layout')

    // Redirect based on role
    if (profile.role === 'admin') {
      redirect('/admin')
    } else {
      redirect('/student')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function logout() {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { error: error.message }
    }

    // Revalidate the current path to update auth state
    revalidatePath('/', 'layout')
    
    // Redirect to home page
    redirect('/')
  } catch (error: any) {
    console.error('Logout error:', error)
    return { error: 'Failed to logout' }
  }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return null
    }

    return {
      ...user,
      profile
    }
  } catch (error) {
    return null
  }
}
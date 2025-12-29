'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createInstructorUser({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone: string }) {
  const supabase = createAdminClient()

  try {
    // 1. Create User in Supabase Auth
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone,
        role: 'instructor'
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return { error: createError.message }
    }

    if (!userData.user) return { error: 'User creation failed' }

    // 2. Ensure Profile exists and has correct role 
    // (Trigger might handle creation, but we want to ensure Role is set correctly)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'instructor', phone: phone, full_name: fullName }) // Ensure sync
      .eq('id', userData.user.id)

    if (profileError) {
      // If update fails, maybe trigger hasn't run yet? or row doesn't exist?
      // With the trigger `handle_new_user`, the row should exist.
      console.error('Error updating profile role:', profileError)
      // We can try upsert just in case trigger failed
      await supabase.from('profiles').upsert({
        id: userData.user.id,
        role: 'instructor',
        full_name: fullName,
        phone: phone
      })
    }

    revalidatePath('/admin/instructors')
    return { success: true, userId: userData.user.id }

  } catch (error: any) {
    console.error('Server Action Error:', error)
    return { error: 'Internal Server Error' }
  }
}
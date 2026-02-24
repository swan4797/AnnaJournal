import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase'

/**
 * Login function using Supabase signInWithPassword
 * Returns success/error status without throwing redirects
 */
export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      return {
        error: true as const,
        message: error.message,
      }
    }

    return { error: false as const, message: '' }
  })

/**
 * Check auth using getClaims - more secure method
 * Uses JWT claims instead of making a network request
 */
export const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    return null
  }

  // Get additional user info from claims
  const claims = data.claims

  return {
    email: (claims.email as string) || '',
  }
})

/**
 * Sign out function
 * Returns success status without throwing redirects
 */
export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      error: true,
      message: error.message,
    }
  }

  return { error: false }
})

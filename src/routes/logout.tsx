import { redirect, createFileRoute } from '@tanstack/react-router'
import { signOut } from '../utils/auth'

export const Route = createFileRoute('/logout')({
  preload: false,
  loader: async () => {
    const result = await signOut()

    if (result.error) {
      // Even on error, redirect to home - user will be logged out or session already invalid
      throw redirect({ href: '/' })
    }

    throw redirect({ href: '/' })
  },
})

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Login } from '../components/Login'
import { Sidebar } from '../components/layout/Sidebar'
import { loginFn } from '../utils/auth'

export { loginFn }

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw new Error('Not authenticated')
    }
  },
  component: AuthedLayout,
  errorComponent: ({ error }) => {
    if (error.message === 'Not authenticated') {
      return <Login />
    }

    throw error
  },
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

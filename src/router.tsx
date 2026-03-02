import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Default Page Loader Component
function DefaultPendingComponent() {
  return (
    <div className="page-loader">
      <div className="page-loader__content">
        <div className="page-loader__spinner" />
        <p className="page-loader__text">Loading...</p>
      </div>
    </div>
  )
}

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPendingComponent: DefaultPendingComponent,
    defaultPendingMs: 100, // Show loader if loading takes more than 100ms
    defaultPendingMinMs: 200, // Show for at least 200ms to avoid flash
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

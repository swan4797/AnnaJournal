interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  // Simple wrapper - sidebar is handled at route level for _authed routes
  return <>{children}</>
}

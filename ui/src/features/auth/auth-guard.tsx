import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'
import { useMe } from './hooks/use-me'

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="text-muted-foreground animate-spin" />
  </div>
)

export const RequireAuth = () => {
  const { isPending, isError } = useMe()
  if (isPending) {
    return <Spinner />
  }

  if (isError) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}

export const RequireGuest = () => {
  const { isPending, isError } = useMe()

  if (isPending) {
    return <Spinner />
  }

  if (isError) {
    return <Outlet />
  }

  return <Navigate to="/" replace />
}

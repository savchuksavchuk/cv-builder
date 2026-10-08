import { Loader2 } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { useMe, useSignOut } from '@/features/auth'
import { Button } from '@/shared/ui/button'

export const AppLayout = () => {
  const { user } = useMe()
  const { signOut, isPending } = useSignOut()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link to="/" className="font-semibold">
            CV Builder
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-muted-foreground hidden truncate text-sm sm:block">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              disabled={isPending}
            >
              {isPending && <Loader2 className="animate-spin" />}
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

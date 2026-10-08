import { Loader2 } from 'lucide-react'
import { useMe, useSignOut } from '@/features/auth'
import { Button } from '@/shared/ui/button'

export const HomePage = () => {
  const { user } = useMe()
  const { signOut, isPending } = useSignOut()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-between gap-4 px-4">
      <p className="truncate text-sm">{user?.email}</p>
      <Button variant="outline" onClick={signOut} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Sign out
      </Button>
    </main>
  )
}

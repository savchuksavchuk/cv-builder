import { AuthForm } from '@/features/auth'

export const SignInPage = () => (
  <main className="flex min-h-screen items-center justify-center px-4">
    <AuthForm mode="sign-in" />
  </main>
)

import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAuthForm, type AuthMode } from './hooks/use-auth-form'

export const AuthForm = ({ mode }: { mode: AuthMode }) => {
  const isSignUp = mode === 'sign-up'
  const { form, isPending, error, onSubmit } = useAuthForm(mode)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} noValidate className="grid w-full max-w-sm gap-4">
      <h1 className="text-2xl font-semibold">
        {isSignUp ? 'Sign up' : 'Sign in'}
      </h1>

      <div className="grid gap-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            aria-invalid={!!errors.password}
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 px-3"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {isPending
          ? isSignUp
            ? 'Signing up…'
            : 'Signing in…'
          : isSignUp
            ? 'Sign up'
            : 'Sign in'}
      </Button>

      <p className="text-muted-foreground text-sm">
        {isSignUp ? (
          <>
            Already have an account?{' '}
            <Link to="/sign-in" className="text-foreground underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account yet?{' '}
            <Link to="/sign-up" className="text-foreground underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </form>
  )
}

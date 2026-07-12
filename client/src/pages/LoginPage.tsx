import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null)

    try {
      await login(values.email, values.password)
      const redirectTarget = (location.state as { from?: string } | null)?.from ?? '/dashboard'
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.'
      setApiError(message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-caption text-muted-foreground">TransitOps</p>
        <h1 className="text-display">Sign in</h1>
        <p className="text-body text-muted-foreground">Use your ops credentials to continue.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} aria-invalid={Boolean(errors.email)} />
          {errors.email ? <p className="text-caption text-danger">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} aria-invalid={Boolean(errors.password)} />
          {errors.password ? <p className="text-caption text-danger">{errors.password.message}</p> : null}
        </div>

        {apiError ? (
          <div className="rounded-md border border-danger/40 bg-red-50 px-3 py-2 text-caption text-danger">
            {apiError}
          </div>
        ) : null}

        <Button type="submit" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </Button>
      </form>

      <div className="text-center space-y-2 pt-2 border-t border-border/60">
        <p className="text-caption text-muted-foreground">
          New to TransitOps?{' '}
          <span
            onClick={() => navigate('/signup')}
            className="text-primary hover:underline cursor-pointer font-semibold"
          >
            Create an Account
          </span>
        </p>
        <p className="text-caption text-muted-foreground">
          <span
            onClick={() => navigate('/')}
            className="hover:underline cursor-pointer text-muted-foreground/80 font-medium"
          >
            ← Back to Landing Page
          </span>
        </p>
      </div>
    </div>
  )
}

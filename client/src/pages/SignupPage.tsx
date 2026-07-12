import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { FormField } from '@/components/common/FormField'

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  role: z.enum(['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: {
      name: '',
      email: '',
      role: 'FLEET_MANAGER',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: SignupFormValues) => {
    setApiError(null)

    try {
      await register(values.name, values.email, values.role, values.password)
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.message || 'Unable to register right now.'
      setApiError(message)
    }
  }

  const roleOptions = [
    { label: 'Fleet Manager', value: 'FLEET_MANAGER' },
    { label: 'Dispatcher', value: 'DISPATCHER' },
    { label: 'Safety Officer', value: 'SAFETY_OFFICER' },
    { label: 'Financial Analyst', value: 'FINANCIAL_ANALYST' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-caption text-muted-foreground">TransitOps</p>
        <h1 className="text-display">Create Account</h1>
        <p className="text-body text-muted-foreground">Register a new operator profile.</p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FormField control={form.control as any} name="name" label="Full Name" placeholder="e.g. Jane Doe" required />
        <FormField control={form.control as any} name="email" label="Email Address" type="email" placeholder="e.g. jane@transitops.com" required />
        <FormField control={form.control as any} name="role" label="Operational Role" type="select" options={roleOptions} required />
        <FormField control={form.control as any} name="password" label="Password" type="password" placeholder="Min. 8 characters" required />
        <FormField control={form.control as any} name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password" required />

        {apiError ? (
          <div className="rounded-md border border-danger/40 bg-red-50 px-3 py-2 text-caption text-danger">
            {apiError}
          </div>
        ) : null}

        <Button type="submit" className="w-full font-bold" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>

      <div className="text-center space-y-2 pt-2 border-t border-border/60">
        <p className="text-caption text-muted-foreground">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-primary hover:underline cursor-pointer font-semibold"
          >
            Sign In
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

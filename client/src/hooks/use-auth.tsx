import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, logout as logoutRequest, register as registerRequest, type AuthUser } from '@/api/auth.api'

const TOKEN_KEY = 'transitops_token'
const USER_KEY = 'transitops_user'

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, role: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw || raw === 'undefined' || raw === 'null') return null
    return raw
  })
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw || raw === 'undefined' || raw === 'null') return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  })

  const login = async (email: string, password: string) => {
    const response = await loginRequest({ email, password })
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    setToken(response.token)
    setUser(response.user)
  }

  const register = async (name: string, email: string, role: string, password: string) => {
    const response = await registerRequest({ name, email, role, password })
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    setToken(response.token)
    setUser(response.user)
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setToken(null)
      setUser(null)
      window.location.assign('/login')
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

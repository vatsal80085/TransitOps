import axiosInstance from '@/lib/axios'

const isMockAuthMode = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterCredentials = {
  name: string
  email: string
  role: string
  password: string
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  if (isMockAuthMode) {
    return {
      token: 'demo-transitops-token',
      user: {
        id: 'demo-user',
        name: 'Demo Operator',
        email: credentials.email,
        role: 'ops-admin',
      },
    }
  }

  const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials)
  return response.data
}

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  if (isMockAuthMode) {
    return {
      token: 'demo-transitops-token',
      user: {
        id: 'demo-user',
        name: credentials.name,
        email: credentials.email,
        role: credentials.role,
      },
    }
  }

  const response = await axiosInstance.post<AuthResponse>('/auth/register', credentials)
  return response.data
}

export const logout = async (): Promise<void> => {
  if (isMockAuthMode) {
    return
  }

  await axiosInstance.post('/auth/logout')
}

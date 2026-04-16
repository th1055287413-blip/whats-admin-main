export interface User {
  id: number
  username: string
  email: string
  real_name?: string
  avatar?: string
  role: string
  roles?: Role[]
  permissions: string[]
  created_at: string
  updated_at: string
  status: string
  last_login_at?: string
}

export interface LoginForm {
  username: string
  password: string
  captcha?: string
  remember: boolean
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  admin: User
  permissions: string[]
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
  permissions: string[]
  roles: string[]
}

export interface Permission {
  id: number
  name: string
  code: string
  description?: string
  resource: string
  action: string
}

export interface Role {
  id: number
  name: string
  code: string
  description?: string
  permissions: Permission[]
}

export interface RefreshTokenResponse {
  access_token: string
  expires_in: number
}
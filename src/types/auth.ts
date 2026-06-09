export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  accessToken: string
}

export interface SignupResponse {
  message: string
}

export interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
  approved: boolean
  createdAt: string
}

export interface PendingUser {
  id: number
  email: string
  name: string | null
  createdAt: string
}

export interface AdminUser {
  id: number
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
  approved: boolean
  createdAt: string
}

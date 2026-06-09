import axios from 'axios'
import type { PendingUser, AdminUser } from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const adminApi = axios.create({
  baseURL: `${API_URL}/admin`,
  withCredentials: true,
})

// Add Bearer token from localStorage if available
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const adminService = {
  login: async (email: string, password: string) => {
    const { data } = await adminApi.post<{ accessToken: string; email: string; name: string | null }>(
      '/login',
      { email, password }
    )
    localStorage.setItem('admin_token', data.accessToken)
    return data
  },

  logout: async () => {
    await adminApi.post('/logout')
    localStorage.removeItem('admin_token')
  },

  getPendingUsers: async () => {
    const { data } = await adminApi.get<PendingUser[]>('/pending')
    return data
  },

  getAllUsers: async () => {
    const { data } = await adminApi.get<AdminUser[]>('/users')
    return data
  },

  approveUser: async (email: string) => {
    const { data } = await adminApi.post<{ message: string }>(
      `/approve?email=${encodeURIComponent(email)}`
    )
    return data
  },

  rejectUser: async (email: string) => {
    const { data } = await adminApi.post<{ message: string }>(
      `/reject?email=${encodeURIComponent(email)}`
    )
    return data
  },

  isLoggedIn: () => {
    return !!localStorage.getItem('admin_token')
  },
}

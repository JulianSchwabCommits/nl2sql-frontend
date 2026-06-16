import type { PendingUser, AdminUser } from '@/types/auth'
import api from './auth'
import { useAuthStore } from '@/stores/authStore'

export const adminService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; email: string; name: string | null }>(
      '/admin/login',
      { email, password }
    )
    return data
  },

  logout: async () => {
    await api.post('/admin/logout')
  },

  getPendingUsers: async () => {
    const { data } = await api.get<PendingUser[]>('/admin/pending')
    return data
  },

  getAllUsers: async () => {
    const { data } = await api.get<AdminUser[]>('/admin/users')
    return data
  },

  approveUser: async (email: string) => {
    const { data } = await api.post<{ message: string }>(
      `/admin/approve?email=${encodeURIComponent(email)}`
    )
    return data
  },

  rejectUser: async (email: string) => {
    const { data } = await api.post<{ message: string }>(
      `/admin/reject?email=${encodeURIComponent(email)}`
    )
    return data
  },

  deleteUser: async (userId: string) => {
    const { data } = await api.delete<{ message: string }>(`/admin/users/${userId}`)
    return data
  },

  updateUserName: async (userId: string, name: string) => {
    const { data } = await api.patch<{ message: string }>(`/admin/users/${userId}/name`, { name })
    return data
  },

  updateUserEmail: async (userId: string, email: string) => {
    const { data } = await api.patch<{ message: string }>(`/admin/users/${userId}/email`, { email })
    return data
  },

  updateUserRole: async (userId: string, role: 'USER' | 'ADMIN') => {
    const { data } = await api.patch<{ message: string }>(`/admin/users/${userId}/role`, { role })
    return data
  },

  resetUserPassword: async (userId: string, password: string) => {
    const { data } = await api.patch<{ message: string }>(`/admin/users/${userId}/password`, { password })
    return data
  },

  isLoggedIn: () => {
    return !!useAuthStore.getState().accessToken
  },
}

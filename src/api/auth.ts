import axios from 'axios'
import type { AuthResponse, LoginDto, RegisterDto, SignupResponse, User } from '@/types/auth'

export interface UpdateProfileDto {
  name?: string
  email?: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/signup')
    ) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post<AuthResponse>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        useAuthStore.getState().setAccessToken(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (dto: LoginDto) => api.post<AuthResponse>('/auth/login', dto),
  signup: (dto: RegisterDto) => api.post<SignupResponse>('/auth/signup', dto),
  refresh: () => api.post<AuthResponse>('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get<User>('/auth/profile'),
  updateProfile: (dto: UpdateProfileDto) => api.patch<User>('/auth/profile', dto),
  changePassword: (dto: ChangePasswordDto) => api.post('/auth/change-password', dto),
  deleteAccount: () => api.delete('/auth/profile'),
}

export default api

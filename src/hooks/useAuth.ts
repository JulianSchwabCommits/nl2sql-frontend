import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import type { LoginDto, RegisterDto } from '@/types/auth'

export function useAuth() {
  const { setAccessToken, setUser, logout: clearAuth, isAuthenticated, user } = useAuthStore()

  const login = async (dto: LoginDto) => {
    const { data } = await authApi.login(dto)
    setAccessToken(data.accessToken)
    const profile = await authApi.profile()
    setUser(profile.data)
  }

  const signup = async (dto: RegisterDto) => {
    const { data } = await authApi.signup(dto)
    setAccessToken(data.accessToken)
    const profile = await authApi.profile()
    setUser(profile.data)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
    }
  }

  return { login, signup, logout, isAuthenticated, user }
}

import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'
import { authApi } from '@/api/auth'
import type { LoginDto } from '@/types/auth'

export function useAuth() {
  const { setAccessToken, setUser, logout: clearAuth, isAuthenticated, user } = useAuthStore()

  const login = async (dto: LoginDto) => {
    const { data } = await authApi.login(dto)
    setAccessToken(data.accessToken)
    const profile = await authApi.profile()
    setUser(profile.data)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      useChatStore.getState().reset()
      clearAuth()
    }
  }

  return { login, logout, isAuthenticated, user }
}

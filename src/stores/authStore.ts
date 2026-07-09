import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import type { User } from '@/types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface AuthState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  setAccessToken: (token: string | null) => void
  setUser: (user: User | null) => void
  logout: () => void
  refreshAccessToken: () => Promise<string | null>
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isInitializing: true,
      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
      refreshAccessToken: async () => {
        try {
          const res = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
          const newToken = res.data.accessToken
          if (newToken) {
            set({ accessToken: newToken, isAuthenticated: true })
            return newToken
          }
          return null
        } catch {
          get().logout()
          return null
        }
      },
      initAuth: async () => {
        const { user } = get()
        // If we have a persisted user, try to restore the session via refresh token
        if (user) {
          await get().refreshAccessToken()
        }
        set({ isInitializing: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
)

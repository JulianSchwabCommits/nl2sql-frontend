import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const initForUser = useChatStore((s) => s.initForUser)
  const ownerId = useChatStore((s) => s._ownerId)

  useEffect(() => {
    // On mount or user change, ensure chat data is loaded for this user
    if (user?.id && ownerId !== user.id) {
      initForUser(user.id)
    }
  }, [user?.id, ownerId, initForUser])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Chat from '@/pages/Chat'
import Profile from '@/pages/Profile'
import Connections from '@/pages/Connections'
import AdminDashboard from '@/pages/AdminDashboard'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { ThemeProvider } from '@/components/theme-provider'
import { useAuthStore } from '@/stores/authStore'

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="nl2sql-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

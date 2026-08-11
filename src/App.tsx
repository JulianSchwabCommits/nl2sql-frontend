import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Chat from '@/pages/Chat'
import AdminDashboard from '@/pages/AdminDashboard'
import General from '@/pages/settings/General'
import ProfileSettings from '@/pages/settings/ProfileSettings'
import LlmSettingsPage from '@/pages/settings/LlmSettings'
import DatabaseSettings from '@/pages/settings/DatabaseSettings'
import Personalization from '@/pages/settings/Personalization'
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
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
              <Route path="/settings" element={<General />} />
              <Route path="/settings/profile" element={<ProfileSettings />} />
              <Route path="/settings/llm" element={<LlmSettingsPage />} />
              <Route path="/settings/databases" element={<DatabaseSettings />} />
              <Route path="/settings/personalization" element={<Personalization />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

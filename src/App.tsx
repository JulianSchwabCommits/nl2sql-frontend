import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Chat from '@/pages/Chat'
import Profile from '@/pages/Profile'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

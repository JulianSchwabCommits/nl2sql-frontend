import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { User, Mail, Calendar, Trash2 } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await authApi.deleteAccount()
      useAuthStore.getState().logout()
      navigate('/login')
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="flex items-center gap-4 px-6 py-3 border-b">
        <h1 className="text-sm font-medium">Account Settings</h1>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Info Section */}
        <section className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b">
            <h2 className="font-medium">Personal Information</h2>
            <p className="text-sm text-muted-foreground">Your account details</p>
          </div>
          <div className="divide-y">
            <div className="flex items-center gap-4 px-6 py-4">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium truncate">{user?.name || '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{user?.email || '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : '--'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Session Section */}
        <section className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b">
            <h2 className="font-medium">Session</h2>
            <p className="text-sm text-muted-foreground">Manage your current session</p>
          </div>
          <div className="px-6 py-4">
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
              Logout
            </Button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-lg border border-destructive/50 bg-card">
          <div className="px-6 py-4 border-b border-destructive/50">
            <h2 className="font-medium text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">Irreversible actions</p>
          </div>
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">Permanently remove your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="shrink-0">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Your account and all associated data will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Yes, delete my account'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

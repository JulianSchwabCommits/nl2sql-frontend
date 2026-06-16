import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/components/theme-provider'
import { User, Mail, Calendar, Trash2, Sun, Moon, Monitor } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
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

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Personal Information */}
        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Personal Information</Label>
              <p className="text-sm text-muted-foreground mt-1">Your account details</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium truncate">{user?.name || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Member since</Label>
                  <p className="text-sm font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '--'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Theme</Label>
              <p className="text-sm text-muted-foreground mt-1">Select your preferred theme</p>
            </div>

            <div className="flex gap-3 pt-2">
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isActive = theme === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Session */}
        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Session</Label>
              <p className="text-sm text-muted-foreground mt-1">Manage your current session</p>
            </div>

            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="w-full rounded-full"
            >
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="rounded-[28px] border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold text-destructive">Danger Zone</Label>
              <p className="text-sm text-muted-foreground mt-1">Irreversible actions</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <div>
                <p className="text-sm font-medium">Delete account</p>
                <p className="text-sm text-muted-foreground">Permanently remove your account and all data</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setDeleteOpen(true)} 
                className="shrink-0 rounded-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
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

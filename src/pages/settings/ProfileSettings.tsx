import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import { User, Mail, Calendar, Trash2, Lock, Check, Loader2 } from 'lucide-react'

export default function ProfileSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Profile edit state
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const profileDirty = name !== (user?.name || '') || email !== (user?.email || '')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const { data } = await authApi.updateProfile({ name: name || undefined, email })
      useAuthStore.getState().setUser(data)
      setProfileMsg({ type: 'success', text: 'Profile updated' })
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwMsg(null)
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setPwSaving(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setPwMsg({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setPwSaving(false)
    }
  }

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
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Your account details and session</p>
        </div>

        {/* Personal Information */}
        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Personal Information</Label>
              <p className="text-sm text-muted-foreground mt-1">Update your name and email</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setProfileMsg(null) }}
                    placeholder="Your name"
                    className="mt-1 rounded-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setProfileMsg(null) }}
                    placeholder="your@email.com"
                    className="mt-1 rounded-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Member since</Label>
                  <p className="text-sm font-medium mt-1">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '--'}
                  </p>
                </div>
              </div>
            </div>

            {profileMsg && (
              <p className={`text-sm ${profileMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {profileMsg.text}
              </p>
            )}

            <Button
              onClick={handleProfileSave}
              disabled={!profileDirty || profileSaving}
              className="w-full rounded-full"
            >
              {profileSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" />Save Changes</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Change Password</Label>
              <p className="text-sm text-muted-foreground mt-1">Update your account password</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPwMsg(null) }}
                    placeholder="••••••••"
                    className="mt-1 rounded-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwMsg(null) }}
                    placeholder="••••••••"
                    className="mt-1 rounded-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPwMsg(null) }}
                    placeholder="••••••••"
                    className="mt-1 rounded-full"
                  />
                </div>
              </div>
            </div>

            {pwMsg && (
              <p className={`text-sm ${pwMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {pwMsg.text}
              </p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || pwSaving}
              className="w-full rounded-full"
            >
              {pwSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Changing...</>
              ) : (
                'Change Password'
              )}
            </Button>
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

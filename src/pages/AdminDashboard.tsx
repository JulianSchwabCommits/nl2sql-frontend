import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { adminService } from '@/api/admin'
import type { PendingUser, AdminUser } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserCheck, UserX, Users, Clock, MoreVertical, Edit, Trash2, Key, Shield, User as UserIcon } from 'lucide-react'

type EditUserDialog = {
  open: boolean
  user: AdminUser | null
  field: 'name' | 'email' | 'role' | 'password' | null
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | number | null>(null)
  const [editDialog, setEditDialog] = useState<EditUserDialog>({ open: false, user: null, field: null })
  const [editValue, setEditValue] = useState('')

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/chat')
    }
  }, [user, navigate])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [pending, all] = await Promise.all([
        adminService.getPendingUsers(),
        adminService.getAllUsers(),
      ])
      setPendingUsers(pending)
      setAllUsers(all)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (email: string) => {
    setActionLoading(email)
    try {
      await adminService.approveUser(email)
      await fetchData()
    } catch (err) {
      console.error('Failed to approve user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (email: string) => {
    if (!confirm(`Are you sure you want to reject and delete ${email}?`)) return
    setActionLoading(email)
    try {
      await adminService.rejectUser(email)
      await fetchData()
    } catch (err) {
      console.error('Failed to reject user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return
    setActionLoading(userId)
    try {
      await adminService.deleteUser(userId.toString())
      await fetchData()
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const openEditDialog = (user: AdminUser, field: EditUserDialog['field']) => {
    setEditDialog({ open: true, user, field })
    if (field === 'name') setEditValue(user.name || '')
    else if (field === 'email') setEditValue(user.email)
    else if (field === 'role') setEditValue(user.role)
    else setEditValue('')
  }

  const handleEditSave = async () => {
    if (!editDialog.user || !editDialog.field) return

    setActionLoading(editDialog.user.id)
    try {
      if (editDialog.field === 'name') {
        await adminService.updateUserName(editDialog.user.id.toString(), editValue)
      } else if (editDialog.field === 'email') {
        await adminService.updateUserEmail(editDialog.user.id.toString(), editValue)
      } else if (editDialog.field === 'role') {
        await adminService.updateUserRole(editDialog.user.id.toString(), editValue as 'USER' | 'ADMIN')
      } else if (editDialog.field === 'password') {
        await adminService.resetUserPassword(editDialog.user.id.toString(), editValue)
      }
      await fetchData()
      setEditDialog({ open: false, user: null, field: null })
    } catch (err) {
      console.error('Failed to update user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const approvedUsers = allUsers.filter((u) => u.approved)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        {/* Pending Approvals */}
        <Card className="rounded-[28px] border-input">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
                <p className="text-sm text-muted-foreground">Users waiting for approval</p>
              </div>
              {pendingUsers.length > 0 && (
                <div className="h-7 min-w-7 px-2 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center justify-center">
                  {pendingUsers.length}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No pending users</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || '-'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleApprove(user.email)}
                            disabled={actionLoading === user.email}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            onClick={() => handleReject(user.email)}
                            disabled={actionLoading === user.email}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Users */}
        <Card className="rounded-[28px] border-input">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">All Users</CardTitle>
                <p className="text-sm text-muted-foreground">{approvedUsers.length} approved users</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {approvedUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No approved users yet</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.name || '-'}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/10 text-purple-500'
                                : 'bg-blue-500/10 text-blue-500'
                            }`}
                          >
                            {u.role === 'ADMIN' && <Shield className="h-3 w-3 mr-1" />}
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionLoading === u.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(u, 'name')}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                Change Name
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(u, 'email')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Change Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(u, 'role')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(u, 'password')}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null, field: null })}>
        <DialogHeader>
          <DialogTitle>
            {editDialog.field === 'name' && 'Change Name'}
            {editDialog.field === 'email' && 'Change Email'}
            {editDialog.field === 'role' && 'Change Role'}
            {editDialog.field === 'password' && 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            Update {editDialog.field} for {editDialog.user?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {editDialog.field === 'role' ? (
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditValue('USER')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    editValue === 'USER'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">User</p>
                  <p className="text-xs text-muted-foreground">Standard access</p>
                </button>
                <button
                  onClick={() => setEditValue('ADMIN')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    editValue === 'ADMIN'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium flex items-center gap-1 justify-center">
                    <Shield className="h-4 w-4" />
                    Admin
                  </p>
                  <p className="text-xs text-muted-foreground">Full access</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                {editDialog.field === 'name' && 'Name'}
                {editDialog.field === 'email' && 'Email'}
                {editDialog.field === 'password' && 'New Password'}
              </Label>
              <Input
                type={editDialog.field === 'password' ? 'password' : editDialog.field === 'email' ? 'email' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={
                  editDialog.field === 'password'
                    ? 'Enter new password'
                    : editDialog.field === 'email'
                    ? 'email@example.com'
                    : 'Enter name'
                }
                className="rounded-full"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditDialog({ open: false, user: null, field: null })}
            disabled={!!actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            disabled={!!actionLoading || !editValue}
          >
            {actionLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

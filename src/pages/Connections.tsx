import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { connectionsApi, type DatabaseConnection, type CreateConnectionDto } from '@/api/connections'
import {
  Database,
  Plus,
  Trash2,
  Pencil,
  Plug,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'

export default function Connections() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<CreateConnectionDto>({
    name: '',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  })

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      const { data } = await connectionsApi.list()
      setConnections(data)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({ name: '', host: '', port: 5432, database: '', username: '', password: '', ssl: false })
    setFormOpen(true)
  }

  const handleOpenEdit = (conn: DatabaseConnection) => {
    setEditingId(conn.id)
    setForm({
      name: conn.name,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      username: conn.username,
      password: '',
      ssl: conn.ssl,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingId) {
        const dto: Record<string, unknown> = {}
        if (form.name) dto.name = form.name
        if (form.host) dto.host = form.host
        if (form.port) dto.port = form.port
        if (form.database) dto.database = form.database
        if (form.username) dto.username = form.username
        if (form.password) dto.password = form.password
        dto.ssl = form.ssl
        await connectionsApi.update(editingId, dto)
      } else {
        await connectionsApi.create(form)
      }
      setFormOpen(false)
      await loadConnections()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await connectionsApi.delete(id)
    setDeleteConfirmId(null)
    await loadConnections()
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    setTestResult(null)
    try {
      const { data } = await connectionsApi.test(id)
      setTestResult({ id, success: data.success, error: data.error })
    } catch (e: any) {
      setTestResult({ id, success: false, error: e.response?.data?.message || 'Connection failed' })
    } finally {
      setTesting(null)
    }
  }

  const handleTestUnsaved = async () => {
    setTesting('unsaved')
    setTestResult(null)
    try {
      const { data } = await connectionsApi.testUnsaved(form)
      setTestResult({ id: 'unsaved', success: data.success, error: data.error })
    } catch (e: any) {
      setTestResult({ id: 'unsaved', success: false, error: e.response?.data?.message || 'Connection failed' })
    } finally {
      setTesting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Database Connections</h1>
            <p className="text-sm text-muted-foreground">
              Manage your database connections ({connections.length}/10)
            </p>
          </div>
          <Button onClick={handleOpenCreate} disabled={connections.length >= 10} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>

        {connections.length === 0 ? (
          <Card className="rounded-[28px] border-input">
            <CardContent className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No connections yet</p>
              <Button onClick={handleOpenCreate} variant="outline" className="mt-4 rounded-full">
                <Plus className="h-4 w-4 mr-2" />
                Add your first connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          connections.map((conn) => (
            <Card key={conn.id} className="rounded-[28px] border-input">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted shrink-0">
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{conn.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {conn.host}:{conn.port}/{conn.database}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        User: {conn.username} {conn.ssl && '(SSL)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {testResult?.id === conn.id && (
                      <span className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-green-500' : 'text-destructive'}`}>
                        {testResult.success ? (
                          <><CheckCircle2 className="h-3.5 w-3.5" /> Connected</>
                        ) : (
                          <><XCircle className="h-3.5 w-3.5" /> {testResult.error}</>
                        )}
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleTest(conn.id)}
                      disabled={testing === conn.id}
                    >
                      {testing === conn.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plug className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleOpenEdit(conn)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirmId(conn.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)}>
        <div className="relative w-full max-w-md mx-auto bg-card rounded-xl border shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Connection' : 'New Connection'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Connection Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Database"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Host</Label>
                <Input
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label>Port</Label>
                <Input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 5432 })}
                />
              </div>
            </div>
            <div>
              <Label>Database</Label>
              <Input
                value={form.database}
                onChange={(e) => setForm({ ...form, database: e.target.value })}
                placeholder="mydb"
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="postgres"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? '(unchanged)' : ''}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ssl"
                checked={form.ssl}
                onChange={(e) => setForm({ ...form, ssl: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="ssl">Use SSL</Label>
            </div>

            {testResult?.id === 'unsaved' && (
              <p className={`text-sm ${testResult.success ? 'text-green-500' : 'text-destructive'}`}>
                {testResult.success ? 'Connection successful!' : `Failed: ${testResult.error}`}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleTestUnsaved}
              disabled={testing === 'unsaved' || !form.host || !form.database || !form.username}
            >
              {testing === 'unsaved' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plug className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.host || !form.database || !form.username || (!editingId && !form.password)}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <div className="relative w-full max-w-sm mx-auto bg-card rounded-xl border shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This connection will be permanently deleted. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  )
}

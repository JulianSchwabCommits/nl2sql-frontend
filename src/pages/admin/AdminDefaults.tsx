import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { adminService } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Check, RotateCcw, Save, AlertTriangle } from 'lucide-react'

export default function AdminDefaults() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [systemPrompt, setSystemPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/chat')
    }
  }, [user, navigate])

  useEffect(() => {
    loadDefault()
  }, [])

  const loadDefault = async () => {
    try {
      const data = await adminService.getDefault('systemPrompt')
      setSystemPrompt(data.value || '')
    } catch {
      setError('Failed to load default system prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await adminService.setDefault('systemPrompt', systemPrompt)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to save default')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    if (!confirm('Restore the default system prompt to the original value? All users using the default prompt will be updated.')) return
    setRestoring(true)
    setError(null)
    try {
      const data = await adminService.restoreDefault('systemPrompt')
      setSystemPrompt(data.value)
    } catch {
      setError('Failed to restore default')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Defaults</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage application-wide default settings</p>
        </div>

        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-base font-semibold">Default System Prompt</Label>
              <p className="text-sm text-muted-foreground mt-1">
                This prompt is used for all users who haven't set a custom prompt
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Saving changes will update the prompt for all users who are using the default. Users with custom prompts will not be affected.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <textarea
                  value={systemPrompt}
                  onChange={(e) => { setSystemPrompt(e.target.value); setError(null) }}
                  rows={16}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y min-h-[300px]"
                  placeholder="Enter the default system prompt..."
                />

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-full"
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : saved ? (
                      <><Check className="h-4 w-4 mr-2" /> Saved!</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> Save Default</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRestore}
                    disabled={restoring}
                    className="rounded-full"
                    title="Restore to original"
                  >
                    {restoring ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><RotateCcw className="h-4 w-4 mr-2" /> Restore Original</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

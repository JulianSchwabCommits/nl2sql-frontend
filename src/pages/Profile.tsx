import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth'
import { llmSettingsApi, type LlmSettings } from '@/api/llm-settings'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/components/theme-provider'
import { User, Mail, Calendar, Trash2, Sun, Moon, Monitor, Key, Bot, Loader2, Check } from 'lucide-react'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // LLM Settings state
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null)
  const [llmLoading, setLlmLoading] = useState(true)
  const [llmSaving, setLlmSaving] = useState(false)
  const [llmSaved, setLlmSaved] = useState(false)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [llmProvider, setLlmProvider] = useState('openai')
  const [llmModel, setLlmModel] = useState('gpt-4o-mini')
  const [llmApiKey, setLlmApiKey] = useState('')

  const modelOptions = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ]

  useEffect(() => {
    loadLlmSettings()
  }, [])

  const loadLlmSettings = async () => {
    try {
      const { data } = await llmSettingsApi.get()
      if (data) {
        setLlmSettings(data)
        setLlmProvider(data.provider)
        setLlmModel(data.model)
      }
    } catch {
      // No settings yet, that's fine
    } finally {
      setLlmLoading(false)
    }
  }

  const handleLlmSave = async () => {
    if (!llmApiKey && !llmSettings?.hasApiKey) {
      setLlmError('API key is required')
      return
    }

    setLlmSaving(true)
    setLlmError(null)
    try {
      const dto = {
        provider: llmProvider,
        model: llmModel,
        apiKey: llmApiKey,
      }
      const { data } = await llmSettingsApi.upsert(dto)
      setLlmSettings(data)
      setLlmApiKey('')
      setLlmSaved(true)
      setTimeout(() => setLlmSaved(false), 2000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setLlmError(error.response?.data?.message || 'Failed to save settings')
    } finally {
      setLlmSaving(false)
    }
  }

  const handleLlmDelete = async () => {
    try {
      await llmSettingsApi.delete()
      setLlmSettings(null)
      setLlmProvider('openai')
      setLlmModel('gpt-4o-mini')
      setLlmApiKey('')
    } catch {
      setLlmError('Failed to delete settings')
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

        {/* LLM Settings */}
        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">LLM Settings</Label>
                <p className="text-sm text-muted-foreground mt-1">Configure your AI provider and API key</p>
              </div>
              {llmSettings?.hasApiKey && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  Configured
                </span>
              )}
            </div>

            {llmLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Provider */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Provider
                  </Label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Model
                  </Label>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={(e) => { setLlmApiKey(e.target.value); setLlmError(null) }}
                    placeholder={llmSettings?.hasApiKey ? '••••••••••••••••••••' : 'sk-...'}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {llmSettings?.hasApiKey && (
                    <p className="text-xs text-muted-foreground">Leave blank to keep your existing key. Enter a new value to replace it.</p>
                  )}
                </div>

                {llmError && (
                  <p className="text-sm text-destructive">{llmError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleLlmSave}
                    disabled={llmSaving}
                    className="flex-1 rounded-full"
                  >
                    {llmSaving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                    ) : llmSaved ? (
                      <><Check className="h-4 w-4 mr-2" /> Saved!</>
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                  {llmSettings && (
                    <Button
                      variant="outline"
                      onClick={handleLlmDelete}
                      className="rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
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

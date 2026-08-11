import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { llmSettingsApi } from '@/api/llm-settings'
import { Loader2, Check, RotateCcw, Save } from 'lucide-react'

export default function Personalization() {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [isDefault, setIsDefault] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrompt()
  }, [])

  const loadPrompt = async () => {
    try {
      const { data } = await llmSettingsApi.getSystemPrompt()
      setSystemPrompt(data.systemPrompt)
      setIsDefault(data.isDefault)
    } catch {
      setError('Failed to load system prompt')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data } = await llmSettingsApi.updateSystemPrompt(systemPrompt)
      setIsDefault(data.isDefault)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setError(error.response?.data?.message || 'Failed to save system prompt')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    setError(null)
    try {
      const { data } = await llmSettingsApi.resetSystemPrompt()
      setSystemPrompt(data.systemPrompt)
      setIsDefault(data.isDefault)
    } catch {
      setError('Failed to reset system prompt')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Personalization</h1>
          <p className="text-sm text-muted-foreground mt-1">Customize the AI assistant behavior</p>
        </div>

        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">System Prompt</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Define how the AI assistant should behave when answering your queries
                </p>
              </div>
              {isDefault && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  Default
                </span>
              )}
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
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm font-mono leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y min-h-[200px]"
                  placeholder="Enter your custom system prompt..."
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
                      <><Save className="h-4 w-4 mr-2" /> Save Prompt</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={resetting || isDefault}
                    className="rounded-full"
                    title="Restore to default"
                  >
                    {resetting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
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

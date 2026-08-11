import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { llmSettingsApi, type LlmSettings, type ModelInfo } from '@/api/llm-settings'
import { Key, Bot, Loader2, Check, Trash2, AlertCircle, RefreshCw } from 'lucide-react'

export default function LlmSettingsPage() {
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null)
  const [llmLoading, setLlmLoading] = useState(true)
  const [llmSaving, setLlmSaving] = useState(false)
  const [llmSaved, setLlmSaved] = useState(false)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [llmProvider, setLlmProvider] = useState('openai')
  const [llmModel, setLlmModel] = useState('')
  const [llmApiKey, setLlmApiKey] = useState('')

  // Dynamic model list
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const hasKey = llmSettings?.hasApiKey || false

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
        if (data.hasApiKey) {
          loadModels()
        }
      }
    } catch {
      // No settings yet
    } finally {
      setLlmLoading(false)
    }
  }

  const loadModels = async () => {
    setModelsLoading(true)
    setModelsError(null)
    try {
      const { data } = await llmSettingsApi.getModels()
      if (data && data.length > 0) {
        setModels(data)
      } else {
        setModels([])
        setModelsError('No models returned.')
      }
    } catch {
      setModelsError('Invalid API key or failed to fetch models.')
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }

  const handleValidateAndLoad = async () => {
    if (!llmApiKey) {
      setLlmError('Enter an API key first')
      return
    }

    setLlmSaving(true)
    setLlmError(null)
    setModelsError(null)
    try {
      // Save the key first
      const dto = { provider: llmProvider, model: llmModel || 'gpt-4o-mini', apiKey: llmApiKey }
      const { data } = await llmSettingsApi.upsert(dto)
      setLlmSettings(data)
      setLlmApiKey('')

      // Now fetch models to validate the key
      setModelsLoading(true)
      try {
        const { data: fetchedModels } = await llmSettingsApi.getModels()
        if (fetchedModels && fetchedModels.length > 0) {
          setModels(fetchedModels)
          // Auto-select first model if none selected
          if (!llmModel || !fetchedModels.find(m => m.id === llmModel)) {
            setLlmModel(fetchedModels[0].id)
          }
        } else {
          setModels([])
          setModelsError('No GPT models found for this key.')
        }
      } catch {
        setModels([])
        setModelsError('Invalid API key. Could not fetch models.')
      } finally {
        setModelsLoading(false)
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setLlmError(error.response?.data?.message || 'Failed to save API key')
    } finally {
      setLlmSaving(false)
    }
  }

  const handleSave = async () => {
    if (!llmModel) {
      setLlmError('Select a model first')
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
      if (llmApiKey) {
        loadModels()
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setLlmError(error.response?.data?.message || 'Failed to save settings')
    } finally {
      setLlmSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await llmSettingsApi.delete()
      setLlmSettings(null)
      setLlmProvider('openai')
      setLlmModel('')
      setLlmApiKey('')
      setModels([])
      setModelsError(null)
    } catch {
      setLlmError('Failed to delete settings')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">LLM Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your AI provider and API key</p>
        </div>

        <Card className="rounded-[28px] border-input">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Provider & Model</Label>
                <p className="text-sm text-muted-foreground mt-1">Choose your AI provider and model</p>
              </div>
              {hasKey && models.length > 0 && (
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

                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={llmApiKey}
                      onChange={(e) => { setLlmApiKey(e.target.value); setLlmError(null) }}
                      placeholder={hasKey ? '••••••••••••••••••••' : 'sk-...'}
                      className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <Button
                      onClick={handleValidateAndLoad}
                      disabled={llmSaving || modelsLoading || !llmApiKey}
                      variant="outline"
                      className="rounded-xl whitespace-nowrap"
                    >
                      {llmSaving || modelsLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validating...</>
                      ) : (
                        <><RefreshCw className="h-4 w-4 mr-2" /> Validate & Load Models</>
                      )}
                    </Button>
                  </div>
                  {hasKey && !llmApiKey && (
                    <p className="text-xs text-muted-foreground">Key saved. Enter a new value to replace it.</p>
                  )}
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Model
                    {modelsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  </Label>
                  <div className="flex gap-2">
                    <select
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      disabled={models.length === 0}
                      className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {models.length === 0 ? (
                        <option value="">
                          {hasKey ? 'Click "Validate & Load Models" to refresh' : 'Enter API key first'}
                        </option>
                      ) : (
                        models.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))
                      )}
                    </select>
                    {hasKey && models.length > 0 && (
                      <Button
                        onClick={loadModels}
                        disabled={modelsLoading}
                        variant="ghost"
                        size="icon"
                        className="rounded-xl shrink-0"
                        title="Refresh models"
                      >
                        <RefreshCw className={`h-4 w-4 ${modelsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                  {modelsError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {modelsError}
                    </p>
                  )}
                </div>

                {llmError && (
                  <p className="text-sm text-destructive">{llmError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={llmSaving || models.length === 0}
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
                      onClick={handleDelete}
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
      </div>
    </div>
  )
}

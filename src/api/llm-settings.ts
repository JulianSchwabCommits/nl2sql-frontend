import api from './auth'

export interface LlmSettings {
  id: string
  provider: string
  model: string
  hasApiKey: boolean
  createdAt: string
  updatedAt: string
}

export interface UpsertLlmSettingsDto {
  provider: string
  model: string
  apiKey: string
}

export interface SystemPromptResponse {
  systemPrompt: string
  isDefault: boolean
}

export interface ModelInfo {
  id: string
  name: string
}

export const llmSettingsApi = {
  get: () => api.get<LlmSettings | null>('/auth/llm-settings'),
  upsert: (dto: UpsertLlmSettingsDto) => api.put<LlmSettings>('/auth/llm-settings', dto),
  delete: () => api.delete('/auth/llm-settings'),
  getSystemPrompt: () => api.get<SystemPromptResponse>('/auth/llm-settings/system-prompt'),
  updateSystemPrompt: (systemPrompt: string) => api.put<SystemPromptResponse>('/auth/llm-settings/system-prompt', { systemPrompt }),
  resetSystemPrompt: () => api.post<SystemPromptResponse>('/auth/llm-settings/system-prompt/reset'),
  getModels: () => api.get<ModelInfo[]>('/auth/llm-settings/models'),
}

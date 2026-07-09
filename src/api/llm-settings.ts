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

export const llmSettingsApi = {
  get: () => api.get<LlmSettings | null>('/auth/llm-settings'),
  upsert: (dto: UpsertLlmSettingsDto) => api.put<LlmSettings>('/auth/llm-settings', dto),
  delete: () => api.delete('/auth/llm-settings'),
}

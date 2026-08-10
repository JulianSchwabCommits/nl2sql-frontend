import api from './auth'

export interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  ssl: boolean
  sshEnabled: boolean
  sshHost?: string
  sshPort?: number
  sshUsername?: string
  sshAuthMethod?: 'password' | 'privateKey'
  createdAt: string
  updatedAt: string
}

export interface CreateConnectionDto {
  name: string
  host: string
  port?: number
  database: string
  username: string
  password: string
  ssl?: boolean
  sshEnabled?: boolean
  sshHost?: string
  sshPort?: number
  sshUsername?: string
  sshAuthMethod?: 'password' | 'privateKey'
  sshPassword?: string
  sshPrivateKey?: string
}

export interface UpdateConnectionDto {
  name?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl?: boolean
  sshEnabled?: boolean
  sshHost?: string
  sshPort?: number
  sshUsername?: string
  sshAuthMethod?: 'password' | 'privateKey'
  sshPassword?: string
  sshPrivateKey?: string
}

export interface TestConnectionResult {
  success: boolean
  error?: string
}

export const connectionsApi = {
  list: () => api.get<DatabaseConnection[]>('/auth/connections'),
  create: (dto: CreateConnectionDto) => api.post<DatabaseConnection>('/auth/connections', dto),
  update: (id: string, dto: UpdateConnectionDto) => api.patch<DatabaseConnection>(`/auth/connections/${id}`, dto),
  delete: (id: string) => api.delete(`/auth/connections/${id}`),
  test: (id: string) => api.post<TestConnectionResult>(`/auth/connections/${id}/test`),
  testUnsaved: (dto: CreateConnectionDto) => api.post<TestConnectionResult>('/auth/connections/test', dto),
}

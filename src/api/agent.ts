import { api } from '@/utils/request'

// ==================== 類型定義 ====================

export interface Agent {
  id: number
  username: string
  workgroup_id: number
  role: 'leader' | 'member'
  status: 'active' | 'inactive'
  last_login_at: string | null
  last_login_ip: string | null
  created_at: string
}

export interface AgentListParams {
  page?: number
  page_size?: number
  keyword?: string
  workgroup_id?: number | string
  role?: string
  status?: string
}

export interface AgentListResponse {
  list: Agent[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CreateAgentRequest {
  username: string
  password: string
  workgroup_id: number
  role: 'leader' | 'member'
}

export interface UpdateAgentRequest {
  status?: 'active' | 'inactive'
  role?: 'leader' | 'member'
}

// ==================== API ====================

export const agentApi = {
  getList(params?: AgentListParams): Promise<AgentListResponse> {
    return api.get('/admin/agents', { params })
  },

  create(data: CreateAgentRequest): Promise<Agent> {
    return api.post('/admin/agents', data)
  },

  update(id: number, data: UpdateAgentRequest): Promise<void> {
    return api.put(`/admin/agents/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/admin/agents/${id}`)
  },

  resetPassword(id: number, newPassword: string): Promise<void> {
    return api.post(`/admin/agents/${id}/reset-password`, { new_password: newPassword })
  }
}

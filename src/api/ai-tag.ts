import request from '@/utils/request'

// AI 標籤定義
export interface AiTagDefinition {
  id: number
  category: string
  key: string
  label: string
  description: string
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateAiTagDefinitionRequest {
  category: string
  key: string
  label: string
  description?: string
  enabled?: boolean
  sort_order?: number
}

export interface UpdateAiTagDefinitionRequest {
  category?: string
  key?: string
  label?: string
  description?: string
  enabled?: boolean
  sort_order?: number
}

export const aiTagApi = {
  list(params?: { page?: number; page_size?: number }) {
    return request.get('/admin/ai-tags', { params })
  },

  create(data: CreateAiTagDefinitionRequest) {
    return request.post('/admin/ai-tags', data)
  },

  update(id: number, data: UpdateAiTagDefinitionRequest) {
    return request.put(`/admin/ai-tags/${id}`, data)
  },

  delete(id: number) {
    return request.delete(`/admin/ai-tags/${id}`)
  }
}

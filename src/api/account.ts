import { api } from '@/utils/request'
import type {
  Account,
  AccountListParams,
  AccountListResponse,
  AccountStatsResponse,
  AccountChartsResponse,
  BatchOperationRequest,
  BatchOperationResponse
} from '@/types/account'
import type { Tag } from '@/types/tag'

export const accountApi = {
  // CRUD
  list(params?: AccountListParams): Promise<AccountListResponse> {
    return api.get('/accounts', { params })
  },

  getById(id: number): Promise<Account> {
    return api.get(`/accounts/${id}`)
  },

  create(data: Partial<Account>): Promise<Account> {
    return api.post('/accounts', data)
  },

  update(id: number, data: Partial<Account>): Promise<Account> {
    return api.patch(`/accounts/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/accounts/${id}`)
  },

  // Batch
  batch(data: BatchOperationRequest): Promise<BatchOperationResponse> {
    return api.post('/accounts/batch', data)
  },

  // Tags
  getTags(id: number): Promise<Tag[]> {
    return api.get(`/accounts/${id}/tags`)
  },

  setTags(id: number, tagIds: number[]): Promise<Tag[]> {
    return api.put(`/accounts/${id}/tags`, { tag_ids: tagIds })
  },

  addTags(id: number, tagIds: number[]): Promise<Tag[]> {
    return api.post(`/accounts/${id}/tags`, { tag_ids: tagIds })
  },

  removeTag(id: number, tagId: number): Promise<void> {
    return api.delete(`/accounts/${id}/tags/${tagId}`)
  },

  // Stats
  getStats(): Promise<AccountStatsResponse> {
    return api.get('/accounts/stats')
  },

  getCharts(params?: {
    period?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  }): Promise<AccountChartsResponse> {
    return api.get('/accounts/charts', { params })
  },

  getIdRange(): Promise<{ min: number; max: number; total: number }> {
    return api.get('/accounts/id-range')
  },

  // Sub-resources
  getSyncStatus(id: number): Promise<any> {
    return api.get(`/accounts/${id}/sync-status`)
  },

  getContacts(id: number, params?: { page?: number; page_size?: number }): Promise<any> {
    return api.get(`/accounts/${id}/contacts`, {
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 50
      }
    })
  },

  getChats(id: number, params?: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<any> {
    return api.get(`/accounts/${id}/chats`, { params })
  },

  updateSettings(id: number, data: Partial<AccountSettings>): Promise<void> {
    return api.patch(`/accounts/${id}/settings`, data)
  },

  // Search
  search(params: { query: string; limit?: number }): Promise<Account[]> {
    return api.get('/accounts/search', { params })
  },

  getDisconnectStats(params?: { period?: '7d' | '30d' | '90d' | 'all' }): Promise<{
    distribution: Array<{ label: string; days_min?: number; days_max?: number; count: number; percentage: number }>
    total_disconnected: number
    never_disconnected: number
  }> {
    return api.get('/accounts/disconnect-stats', { params })
  },

  getByPhone(phone: string): Promise<Account | undefined> {
    return api.get('/accounts', { params: { phone, page: 1, page_size: 1 } })
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res.items
        return list && list.length > 0 ? list[0] : undefined
      })
  }
}

export interface AccountSettings {
  push_name: string
  ai_analysis_enabled: boolean
  keep_chats_archived: boolean
}

export default accountApi

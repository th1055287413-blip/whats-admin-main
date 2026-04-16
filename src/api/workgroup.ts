import { api } from '@/utils/request'

// ==================== 類型定義 ====================

export interface Workgroup {
  id: number
  name: string
  code: string
  type: 'sales' | 'marketing' | 'admin' | 'admin'
  description: string
  status: 'active' | 'disabled' | 'archived'
  created_by: number
  created_at: string
  updated_at: string
}

export interface WorkgroupListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
  type?: string
}

export interface WorkgroupListResponse {
  list: Workgroup[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CreateWorkgroupRequest {
  name: string
  code?: string
  type: 'sales' | 'marketing' | 'admin'
  description?: string
}

export interface UpdateWorkgroupRequest {
  name?: string
  code?: string
  description?: string
  status?: 'active' | 'disabled'
}

// 工作組帳號
export interface WorkgroupAccount {
  id: number
  workgroup_id: number
  account_id: number
  assigned_agent_id: number | null
  assigned_by: number
  assigned_at: string
  phone_number: string
  push_name: string
  account_status: string
  agent_name: string | null
}

export interface WorkgroupAccountListResponse {
  list: WorkgroupAccount[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 可分配帳號
export interface AssignableAccount {
  id: number
  phone_number: string
  push_name: string
  status: string
}

export interface AssignableAccountParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
  workgroup_type?: string
}

// 條件分配
export interface AssignableCountParams {
  tag_ids?: number[]
  authorized_minutes_gt?: number
  workgroup_type?: string
}

export interface AssignByConditionRequest {
  tag_ids?: number[]
  authorized_minutes_gt?: number
  count: number
}

export interface AssignableAccountListResponse {
  list: AssignableAccount[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ==================== API ====================

export const workgroupApi = {
  getList(params?: WorkgroupListParams): Promise<WorkgroupListResponse> {
    return api.get('/admin/workgroups', { params })
  },

  getById(id: number): Promise<Workgroup> {
    return api.get(`/admin/workgroups/${id}`)
  },

  create(data: CreateWorkgroupRequest): Promise<Workgroup> {
    return api.post('/admin/workgroups', data)
  },

  update(id: number, data: UpdateWorkgroupRequest): Promise<void> {
    return api.put(`/admin/workgroups/${id}`, data)
  },

  archive(id: number): Promise<void> {
    return api.post(`/admin/workgroups/${id}/archive`)
  },

  // 帳號管理
  getAccounts(id: number, params?: { page?: number; page_size?: number }): Promise<WorkgroupAccountListResponse> {
    return api.get(`/admin/workgroups/${id}/accounts`, { params })
  },

  assignAccounts(id: number, accountIds: number[]): Promise<void> {
    return api.post(`/admin/workgroups/${id}/accounts`, { account_ids: accountIds })
  },

  removeAccounts(id: number, accountIds: number[]): Promise<void> {
    return api.delete(`/admin/workgroups/${id}/accounts`, { data: { account_ids: accountIds } })
  },

  // 可分配帳號
  getAssignableAccounts(params?: AssignableAccountParams): Promise<AssignableAccountListResponse> {
    return api.get('/admin/accounts/assignable', { params })
  },

  // 條件分配
  getAssignableCount(params?: AssignableCountParams): Promise<{ count: number }> {
    return api.get('/admin/accounts/assignable/count', { params })
  },

  assignByCondition(id: number, data: AssignByConditionRequest): Promise<{ assigned_count: number }> {
    return api.post(`/admin/workgroups/${id}/accounts/assign-by-condition`, data)
  }
}

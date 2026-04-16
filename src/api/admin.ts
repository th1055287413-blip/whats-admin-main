import { api } from '@/utils/request'

// 后管用户接口
export interface AdminUser {
  id: number
  username: string
  email: string
  status: string
  created_at: string
  updated_at: string
  last_login_at?: string
  last_login_ip?: string
  channel_id?: number | null
  channel_name?: string
}

// 后管用户列表响应
export interface AdminUserListResponse {
  list: AdminUser[]
  total: number
  page: number
  limit: number
}

// 创建后管用户请求
export interface AdminUserCreateRequest {
  username: string
  email: string
  password: string
  confirm_password: string
  status?: string
  channel_id?: number | null
}

// 更新后管用户请求
export interface AdminUserUpdateRequest {
  email?: string
  password?: string
  confirm_password?: string
  status?: string
  channel_id?: number | null
}

// 用户分配接口
export interface UserAssignment {
  type: 'explicit' | 'range'
  user_ids?: number[]
  user_range_start?: number
  user_range_end?: number
}

// 已分配用户响应
export interface AssignedUsersResponse {
  admin_id: number
  admin_name: string
  type: string
  assigned_user_ids?: number[]
  user_range_start?: number
  user_range_end?: number
  total: number
}

// 后管用户管理API
export const adminUserApi = {
  // 获取后管用户列表
  getList(params: {
    page?: number
    limit?: number
    keyword?: string
    status?: string
    channel_id?: number | string
  } = {}): Promise<AdminUserListResponse> {
    return api.get('/admin/users', { params })
  },

  // 获取后管用户详情
  getById(id: number): Promise<AdminUser> {
    return api.get(`/admin/users/${id}`)
  },

  // 创建后管用户
  create(data: AdminUserCreateRequest): Promise<AdminUser> {
    return api.post('/admin/users', data)
  },

  // 更新后管用户
  update(id: number, data: AdminUserUpdateRequest): Promise<AdminUser> {
    return api.put(`/admin/users/${id}`, data)
  },

  // 删除后管用户
  delete(id: number): Promise<void> {
    return api.delete(`/admin/users/${id}`)
  },

  // 更新后管用户状态
  updateStatus(id: number, status: string): Promise<AdminUser> {
    return api.put(`/admin/users/${id}/status`, { status })
  },

  // 重置后管用户密码
  resetPassword(id: number, newPassword: string): Promise<void> {
    return api.post(`/admin/users/${id}/reset-password`, {
      new_password: newPassword
    })
  },

  // ========== 用户分配管理 ==========

  // 获取管理员已分配的用户
  getAssignedUsers(adminId: number): Promise<AssignedUsersResponse> {
    return api.get(`/admin/users/${adminId}/user-assignments`)
  },

  // 为管理员分配用户
  assignUsers(adminId: number, data: UserAssignment): Promise<{ message: string; assigned_count: number }> {
    return api.post(`/admin/users/${adminId}/user-assignments`, data)
  },

  // 移除用户分配
  removeUserAssignments(adminId: number): Promise<{ message: string }> {
    return api.delete(`/admin/users/${adminId}/user-assignments`)
  },

  // 获取当前管理员今日统计
  getMyTodayStats(): Promise<{ today_conversations: number; today_messages: number }> {
    return api.get('/admin/users/me/today-stats')
  }
}

export default adminUserApi
